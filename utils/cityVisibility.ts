// Central, app-wide "which cities can see this?" rule.
//
// Both a MARKET and the ADMIN / main store can now serve MULTIPLE cities (an
// array). A logged-in user only sees items whose serving-city list includes
// their own city. Guests (no city) and entities with no city restriction stay
// visible, so nothing breaks for guests or for data that hasn't been given a
// city yet.
//
// The serving cities can arrive in a few shapes/names (and historically it was
// a single string at `location.city`). To stay robust we look in every known
// place and accept a string, an array, or an object like { city } / { name }.

import { SettingsService } from "@/services/api";
import { pointInAnyRegion, type DeliveryRegion } from "@/utils/geo";

import type {
    CityEntity,
    CityValue,
} from "@/types/utils/cityVisibility.types";

// Field names (besides location.city / location.cities) that may hold the
// serving-cities list on a market / settings / product object.
const CITY_ARRAY_KEYS = [
	"cities",
	"serviceCities",
	"serviceableCities",
	"deliveryCities",
	"servingCities",
];

// Normalize anything (string | string[] | object{city|name} | nested arrays)
// into a clean, lower-cased array of city names.
const toCityList = (value: CityValue): string[] => {
	if (!value) return [];
	if (Array.isArray(value)) return value.flatMap(toCityList);
	if (typeof value === "string") {
		const s = value.trim().toLowerCase();
		return s ? [s] : [];
	}
	if (typeof value === "object") {
		// e.g. { city: "Beirut" } or { name: "Beirut" }
		return toCityList((value.city ?? value.name ?? "") as CityValue);
	}
	return [];
};

/**
 * Pull the full list of cities an entity serves, checking every known shape.
 * Works for a market object, a kitchen's `market`, the admin settings object,
 * or a product. Returns a de-duplicated, lower-cased array (possibly empty).
 */
export const getEntityCities = (entity: unknown): string[] => {
	if (!entity || typeof entity !== "object") return [];

	const e = entity as CityEntity;
	const out: string[] = [];

	// location.cities (array) / location.city (string OR array)
	const loc = e.location as
		| { city?: CityValue; cities?: CityValue }
		| undefined;
	if (loc && typeof loc === "object") {
		out.push(...toCityList(loc.cities));
		out.push(...toCityList(loc.city));
	}

	// top-level array fields (cities, serviceCities, ...)
	for (const key of CITY_ARRAY_KEYS) out.push(...toCityList(e[key] as CityValue));

	// top-level single `city`
	out.push(...toCityList(e.city as CityValue));

	return [...new Set(out)];
};

/**
 * Core gate: may a user in `userCity` see something that serves `cities`?
 *
 * - Guest / no user city      -> always allowed (sees everything)
 * - No serving cities at all   -> always allowed (no restriction set yet)
 * - Otherwise                  -> allowed only if the user's city is in the list
 *
 * `cities` may be a ready-made list (array) or any entity to read cities from.
 */
export const cityMatches = (
	cities: string[] | unknown,
	userCity: string | null | undefined,
): boolean => {
	const user = (userCity || "").trim().toLowerCase();
	if (!user) return true; // guests see everything

	const list = Array.isArray(cities) ? cities : getEntityCities(cities);
	if (!list.length) return true; // no restriction configured

	return list.includes(user);
};

/**
 * Convenience: does this market/kitchen-market/product entity serve the user's
 * city? Reads the cities off the entity itself.
 */
export const entityServesCity = (
	entity: unknown,
	userCity: string | null | undefined,
): boolean => cityMatches(getEntityCities(entity), userCity);

// ---------------------------------------------------------------------------
// City OR map-pin range rule (the single gate used everywhere)
// ---------------------------------------------------------------------------

type Coords = { latitude: number; longitude: number };

/** Reads an entity's configured delivery-range circles (`deliveryRegions`). */
export const getEntityDeliveryRegions = (entity: unknown): DeliveryRegion[] => {
	const regions = (entity as { deliveryRegions?: unknown } | null | undefined)
		?.deliveryRegions;
	return Array.isArray(regions) ? (regions as DeliveryRegion[]) : [];
};

/** Is the shopper's exact pin inside ANY of the configured circles? */
export const pinInsideRegions = (
	pin: Coords | null | undefined,
	regions: DeliveryRegion[] | null | undefined,
): boolean => {
	if (!pin || !Array.isArray(regions) || !regions.length) return false;
	return pointInAnyRegion(pin.latitude, pin.longitude, regions);
};

/**
 * THE visibility rule for a market / the main store, given the shopper's city
 * and their exact map pin:
 *
 *   1. Pin INSIDE a configured delivery circle  -> VISIBLE, always.
 *      The pin is the most precise signal we have, so it wins over the city on
 *      the account (which is often just "Beirut" from a fallback, or stale).
 *   2. No circles configured, or the shopper has no pin
 *                                               -> fall back to the city rule.
 *   3. Circles configured and the pin is OUTSIDE all of them
 *                                               -> hidden (out of range).
 *
 * Guests (no city) and entities with no city restriction stay visible, exactly
 * as before.
 */
export const isVisibleForCityOrPin = (
	cities: string[] | unknown,
	regions: DeliveryRegion[] | null | undefined,
	userCity: string | null | undefined,
	pin: Coords | null | undefined,
): boolean => {
	// 1. Pin inside the range -> show it, whatever the city says.
	if (pinInsideRegions(pin, regions)) return true;

	const cityOk = cityMatches(cities, userCity);
	const hasRegions = Array.isArray(regions) && regions.length > 0;

	// 2. Nothing to check against a pin -> city-based rule only.
	if (!hasRegions || !pin) return cityOk;

	// 3. A range IS configured and the pin falls outside it -> out of range.
	return false;
};

/**
 * Convenience wrapper of {@link isVisibleForCityOrPin} that reads both the
 * serving cities and the delivery circles off the entity itself (a market, a
 * kitchen's market, a product's market, ...).
 */
export const entityVisibleForCityOrPin = (
	entity: unknown,
	userCity: string | null | undefined,
	pin: Coords | null | undefined,
): boolean =>
	isVisibleForCityOrPin(
		getEntityCities(entity),
		getEntityDeliveryRegions(entity),
		userCity,
		pin,
	);

// ---------------------------------------------------------------------------
// Admin / main-store serving cities
// ---------------------------------------------------------------------------
// Main-store products have `market: null`, so their serving cities come from a
// single global place (the admin settings) rather than from each product. We
// fetch it once and cache it for the session. If the settings don't expose any
// cities, getAdminCities() returns [] and the main store stays visible to all
// (backward compatible with the previous "main store shown to everyone").

let adminCitiesPromise: Promise<string[]> | null = null;
let adminCitiesFetchedAt = 0;
// Re-fetch the admin's serving cities at most this often. Short enough that a
// city change in the dashboard shows up on the next pull-to-refresh / screen
// open, long enough to avoid hitting the settings endpoint on every render.
const ADMIN_CITIES_TTL = 30 * 1000; // 30 seconds

const fetchAdminCities = async (): Promise<string[]> => {
	try {
		const res = await SettingsService.getPublic();
		// Admin cities may live directly on the settings object or under a
		// nested key; getEntityCities checks all the known shapes.
		return getEntityCities(res?.data ?? res);
	} catch {
		// Network/parse error -> no restriction (don't hide everything on a blip).
		return [];
	}
};

/**
 * Returns the admin / main-store serving cities (lower-cased array), cached for
 * the session. Pass `{ force: true }` to refetch (e.g. on pull-to-refresh).
 */
export const getAdminCities = ({ force = false }: { force?: boolean } = {}): Promise<string[]> => {
	const isStale = Date.now() - adminCitiesFetchedAt > ADMIN_CITIES_TTL;
	if (force || isStale || !adminCitiesPromise) {
		adminCitiesPromise = fetchAdminCities();
		adminCitiesFetchedAt = Date.now();
	}
	return adminCitiesPromise;
};

/** Clears the cached admin cities so the next read refetches. */
export const refreshAdminCities = (): void => {
	adminCitiesPromise = null;
	adminCitiesFetchedAt = 0;
};

/**
 * Does the admin / main store serve `userCity`? Guests (no city) and an admin
 * with no configured cities are always served.
 */
export const isCityServedByAdmin = async (
	userCity: string | null | undefined,
	opts?: { force?: boolean },
): Promise<boolean> => {
	const user = (userCity || "").trim();
	if (!user) return true; // guests see everything
	const cities = await getAdminCities(opts);
	return cityMatches(cities, user);
};

// ---------------------------------------------------------------------------
// Admin / main-store delivery-range pins (map pin(s) + radius)
// ---------------------------------------------------------------------------
// Mirrors a market's `deliveryRegions`: the main store can now also declare
// exact map-pin coverage circles on the admin Profile page. When configured,
// a shopper's exact map pin must fall inside at least one circle to see
// main-store items/categories/search results — same rule already enforced
// for markets on the home slider and in search.

let adminRegionsPromise: Promise<DeliveryRegion[]> | null = null;
let adminRegionsFetchedAt = 0;
const ADMIN_REGIONS_TTL = 30 * 1000; // 30 seconds

const fetchAdminRegions = async (): Promise<DeliveryRegion[]> => {
	try {
		const res = await SettingsService.getPublic();
		const data = (res?.data ?? res) as { deliveryRegions?: unknown };
		return Array.isArray(data?.deliveryRegions)
			? (data.deliveryRegions as DeliveryRegion[])
			: [];
	} catch {
		return [];
	}
};

/**
 * Returns the main store's configured delivery-range pins (cached for the
 * session). Pass `{ force: true }` to refetch (e.g. on pull-to-refresh).
 */
export const getAdminDeliveryRegions = (
	{ force = false }: { force?: boolean } = {},
): Promise<DeliveryRegion[]> => {
	const isStale = Date.now() - adminRegionsFetchedAt > ADMIN_REGIONS_TTL;
	if (force || isStale || !adminRegionsPromise) {
		adminRegionsPromise = fetchAdminRegions();
		adminRegionsFetchedAt = Date.now();
	}
	return adminRegionsPromise;
};

/** Clears the cached admin delivery regions so the next read refetches. */
export const refreshAdminDeliveryRegions = (): void => {
	adminRegionsPromise = null;
	adminRegionsFetchedAt = 0;
};

/**
 * Is `pin` inside the main store's configured delivery range? No regions
 * configured, or no pin available (guest / user hasn't set one) -> allowed
 * (falls back to the city-based rule instead).
 */
export const isAdminInDeliveryRange = async (
	pin: { latitude: number; longitude: number } | null | undefined,
	opts?: { force?: boolean },
): Promise<boolean> => {
	const regions = await getAdminDeliveryRegions(opts);
	if (!regions.length) return true; // no green zone -> city-based only
	if (!pin) return true; // no shopper pin -> city-based fallback
	return pointInAnyRegion(pin.latitude, pin.longitude, regions);
};

/**
 * Combined main-store visibility gate. The shopper sees the main store when
 * EITHER their exact map pin falls inside one of the admin's configured
 * delivery circles, OR (no circles / no pin) their city is one the admin
 * serves. A shopper whose pin is inside the range is never hidden because of
 * a city mismatch — see {@link isVisibleForCityOrPin}.
 */
export const isServedByAdmin = async (
	userCity: string | null | undefined,
	pin: { latitude: number; longitude: number } | null | undefined,
	opts?: { force?: boolean },
): Promise<boolean> => {
	const [cities, regions] = await Promise.all([
		getAdminCities(opts),
		getAdminDeliveryRegions(opts),
	]);
	return isVisibleForCityOrPin(cities, regions, userCity, pin);
};

export default entityServesCity;

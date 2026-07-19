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

// A serving-cities value can arrive in many shapes over the wire.
type CityValue =
	| string
	| null
	| undefined
	| { city?: unknown; name?: unknown }
	| CityValue[];

// A generic entity (market, kitchen market, settings, product) that may carry
// serving-cities info under a variety of keys.
type CityEntity = Record<string, unknown> & {
	location?: { city?: CityValue; cities?: CityValue } | unknown;
};

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

export default entityServesCity;

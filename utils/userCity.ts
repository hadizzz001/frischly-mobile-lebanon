import { AuthService } from "@/services/api";
import type { AuthPayload, User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";
import { detectCityFromLocation } from "./cityDetection";

// Google sign-in doesn't collect a city/state/street (unlike phone
// registration, which has a dedicated city picker), so brand-new Google
// accounts land with no address at all. Falling back to "" makes them see
// every market/product feed city-unfiltered, which looks like "the city
// isn't showing" to the shopper. FORCE every one of city/state/street to
// "Beirut" whenever it's missing/invalid — no GPS dependency, no silent
// no-op. This must run every single time, for every Google sign-in/sign-up.
const DEFAULT_CITY = "Beirut";
const DEFAULT_STATE = "Beirut";
const DEFAULT_STREET = "Beirut";
// Exact Beirut city-center map pin. Used whenever the shopper denied the
// location permission (or GPS failed), so the account still gets a real,
// usable pin instead of an empty one.
const DEFAULT_PIN = { latitude: 33.8938, longitude: 35.5018 };

// Treats anything that isn't a real, meaningful string as "missing" — this is
// the "null OR undefined OR empty OR 0 OR 'Not provided'" check the caller
// asked for, all in one place so every field is validated identically.
const isMissing = (value: unknown): boolean => {
	if (value === null || value === undefined) return true;
	if (typeof value === "number") return value === 0;
	const str = String(value).trim().toLowerCase();
	return (
		str === "" ||
		str === "0" ||
		str === "not provided" ||
		str === "n/a" ||
		str === "null" ||
		str === "undefined"
	);
};

type StoredUserData = {
	token?: string;
	user?: User;
	address?: { city?: string };
	data?: { user?: User };
};

/**
 * Reads the city from whatever shape the stored userData happens to be in.
 * Different flows have stored userData slightly differently over time, so we
 * defensively check every known path before giving up.
 */
const readCityFromStored = (parsed: StoredUserData | null): string =>
	parsed?.user?.address?.city ||
	parsed?.address?.city ||
	parsed?.data?.user?.address?.city ||
	"";

/**
 * Returns the logged-in user's city, or "" for guests / users without a city.
 *
 * Used to scope product and market feeds so that a logged-in user only sees
 * markets (and market-owned products) located in their own city. Guests see
 * everything.
 *
 * The locally stored userData can be stale or come from a login response that
 * didn't include the full address, so we fetch the current profile from
 * `/api/auth/me` and refresh the cache. On any network/parse error we fall
 * back to whatever city is already stored locally.
 *
 * @returns {Promise<string>}
 */
export const getUserCity = async (): Promise<string> => {
	try {
		const stored = await AsyncStorage.getItem("userData");
		const guest = await AsyncStorage.getItem("guest");

		// Guests (or not logged in) see everything.
		if (!stored || guest === "true") return "";

		const parsed: StoredUserData = JSON.parse(stored);
		const token = parsed?.token;
		const storedCity = readCityFromStored(parsed);

		// No token to refresh with -> use whatever we have locally.
		if (!token) return storedCity;

		try {
			const res = await AuthService.me();
			const freshUser = (res.data as unknown as { user?: User })?.user;

			if (freshUser) {
				// Keep the local cache in sync so the rest of the app sees the
				// up-to-date city/address too.
				await AsyncStorage.setItem(
					"userData",
					JSON.stringify({ token, user: freshUser })
				);
				return freshUser?.address?.city || storedCity;
			}
		} catch {
			// network error -> fall through to stored value
		}

		return storedCity;
	} catch {
		// ignore storage/parse errors -> treat as no city (show everything)
	}
	return "";
};

/**
 * Resolves the address to send along with a Google sign-in / sign-up.
 *
 * Tries GPS + reverse geocoding first (best effort, never throws, never
 * blocks). If the shopper DENIED the location permission — or GPS/geocoding
 * failed for any reason — every field falls back to the Beirut default and
 * the pin is dropped exactly on Beirut city center.
 *
 * The result is always a complete address (city + state + street + country +
 * location), so the backend never has to store an empty/"Not provided" field.
 */
export const resolveGoogleAddress = async (): Promise<{
	street: string;
	city: string;
	state: string;
	country: string;
	location: { latitude: number; longitude: number };
}> => {
	const detected = await detectCityFromLocation().catch(() => null);

	return {
		street: detected?.street || DEFAULT_STREET,
		city: detected?.city || DEFAULT_CITY,
		state: detected?.region || DEFAULT_STATE,
		country: "LB",
		location: {
			latitude: detected?.latitude ?? DEFAULT_PIN.latitude,
			longitude: detected?.longitude ?? DEFAULT_PIN.longitude,
		},
	};
};

/**
 * Ensures the given auth payload's user has city/state/street set. Used right
 * after a Google sign-in/sign-up, which never goes through the manual city
 * picker.
 *
 * FORCES every one of city/state/street to "Beirut" whenever that specific
 * field is missing/null/undefined/empty/0/"Not provided" — each field is
 * checked and defaulted independently, so e.g. a city that came back from GPS
 * detection is kept while a still-missing street/state gets forced to
 * Beirut. Attempts GPS auto-detect first (best-effort, never blocks/throws),
 * then forces Beirut on top of whatever detection didn't fill in.
 *
 * Always (awaited, not fire-and-forget) persists the resolved address to the
 * backend via `/auth/profile` so it's guaranteed saved before the caller
 * navigates into the app, and emits `userCityChanged` so the header's city
 * pill and the home screen's feeds refresh immediately — no manual
 * hard-refresh needed.
 *
 * Returns the (possibly patched) payload to store in AsyncStorage.
 */
export const ensureDefaultCity = async (
	userData: AuthPayload,
): Promise<AuthPayload> => {
	const existingAddress = userData?.user?.address ?? {};
	const needsCity = isMissing(existingAddress.city);
	const needsState = isMissing(existingAddress.state);
	const needsStreet = isMissing(existingAddress.street);
	const needsPin =
		isMissing(existingAddress.location?.latitude) ||
		isMissing(existingAddress.location?.longitude);

	// Nothing to fix — every field already has a real value.
	if (!needsCity && !needsState && !needsStreet && !needsPin) return userData;

	// Best-effort GPS auto-detect (never throws) — only used to fill in
	// whichever fields are actually missing; never overrides existing values.
	// When the shopper denies the location permission this simply returns null
	// and every field below falls back to the Beirut defaults.
	const detected = await detectCityFromLocation().catch(() => null);

	const city = needsCity ? (detected?.city || DEFAULT_CITY) : existingAddress.city;
	const street = needsStreet ? (detected?.street || DEFAULT_STREET) : existingAddress.street;
	const state = needsState ? (detected?.region || DEFAULT_STATE) : existingAddress.state;
	const location = needsPin
		? {
				latitude: detected?.latitude ?? DEFAULT_PIN.latitude,
				longitude: detected?.longitude ?? DEFAULT_PIN.longitude,
			}
		: existingAddress.location;

	const patched: AuthPayload = {
		...userData,
		user: {
			...userData.user,
			address: {
				...existingAddress,
				city,
				street,
				state,
				country: existingAddress.country || "LB",
				location,
			},
		},
	};

	// Persist to the backend right away (awaited, not fire-and-forget) so the
	// saved profile is guaranteed to reflect the resolved address before the
	// caller navigates into the app / any screen re-fetches `/auth/me`.
	// Failures are swallowed — the local value is already set so the shopper
	// still sees the address immediately, and it will be retried the next
	// time the profile is opened/saved.
	try {
		await AuthService.updateProfile({
			address: { city, street, state, country: existingAddress.country || "LB", location },
		});
	} catch {
		// ignore — non-fatal, local value already applied
	}

	// Force the header's city dropdown pill AND the home screen's city-scoped
	// feeds (markets, main store, categories) to refresh immediately with the
	// new Beirut default — same event the header's manual city picker fires,
	// so no separate "hard refresh" step is needed anywhere in the app.
	DeviceEventEmitter.emit("userCityChanged", { city, state });

	return patched;
};

/**
 * Returns the logged-in user's exact map pin (address.location lat/lng), or
 * `null` for guests / users who haven't set one.
 *
 * Mirrors {@link getUserCity}: refreshes from `/api/auth/me` so a stale local
 * cache doesn't miss a pin set on another device, falling back to whatever is
 * stored locally on any network error.
 *
 * Used to precisely match the shopper's location against a market's
 * delivery-region pin + radius (the "green zone" configured on the map),
 * which is more accurate than city-only matching.
 */
export const getUserLocationPin = async (): Promise<{
	latitude: number;
	longitude: number;
} | null> => {
	const { pin } = await getUserCityAndPin();
	return pin;
};

/**
 * Fetches the logged-in user's city AND exact map pin in a single
 * `/api/auth/me` round-trip (guests get `{ city: "", pin: null }`).
 *
 * This is the combined, race-free version of calling {@link getUserCity} and
 * {@link getUserLocationPin} separately — both used to independently hit
 * `/api/auth/me`, which could momentarily disagree if the profile changed
 * mid-flight. Prefer this when a caller needs both values together (e.g. the
 * markets slider, which must compare the shopper's pin against a market's
 * delivery range while also city-scoping the list).
 */
export const getUserCityAndPin = async (): Promise<{
	city: string;
	pin: { latitude: number; longitude: number } | null;
}> => {
	const readPin = (parsed: StoredUserData | null) => {
		const loc =
			parsed?.user?.address?.location ||
			parsed?.data?.user?.address?.location;
		if (
			loc &&
			typeof loc.latitude === "number" &&
			typeof loc.longitude === "number"
		) {
			return { latitude: loc.latitude, longitude: loc.longitude };
		}
		return null;
	};

	try {
		const stored = await AsyncStorage.getItem("userData");
		const guest = await AsyncStorage.getItem("guest");
		if (!stored || guest === "true") return { city: "", pin: null };

		const parsed: StoredUserData = JSON.parse(stored);
		const token = parsed?.token;
		const storedCity = readCityFromStored(parsed);
		const storedPin = readPin(parsed);

		if (!token) return { city: storedCity, pin: storedPin };

		try {
			const res = await AuthService.me();
			const freshUser = (res.data as unknown as { user?: User })?.user;
			if (freshUser) {
				await AsyncStorage.setItem(
					"userData",
					JSON.stringify({ token, user: freshUser })
				);
				const loc = freshUser?.address?.location;
				const freshPin =
					loc &&
					typeof loc.latitude === "number" &&
					typeof loc.longitude === "number"
						? { latitude: loc.latitude, longitude: loc.longitude }
						: storedPin;
				return { city: freshUser?.address?.city || storedCity, pin: freshPin };
			}
		} catch {
			// network error -> fall through to stored values
		}

		return { city: storedCity, pin: storedPin };
	} catch {
		// ignore storage/parse errors -> treat as guest (show everything)
	}
	return { city: "", pin: null };
};

export default getUserCity;

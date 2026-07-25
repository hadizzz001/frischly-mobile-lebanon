import { AuthService } from "@/services/api";
import type { AuthPayload, User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { detectCityFromLocation } from "./cityDetection";

// Google sign-in doesn't collect a city (unlike phone registration, which has
// a dedicated city picker), so brand-new Google accounts land with no
// address.city. Falling back to "" makes them see every market/product feed
// city-unfiltered, which looks like "the city isn't showing" to the shopper.
// We try to auto-detect it via GPS (same as the register screen), and only
// fall back to Beirut if that fails.
const DEFAULT_CITY = "Beirut";
const DEFAULT_STATE = "Lebanon";

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
 * Ensures the given auth payload's user has a city set. Used right after a
 * Google sign-in/sign-up, which never goes through the manual city picker.
 *
 * Tries to auto-detect the city (and street/state) from the device's GPS
 * location — same helper the register screen uses — and only falls back to
 * Beirut if detection fails (permission denied, no GPS, no match, etc).
 *
 * Best-effort persists the resolved address to the backend via
 * `/auth/profile` so it sticks across devices/sessions, without blocking the
 * caller on that network call.
 *
 * Returns the (possibly patched) payload to store in AsyncStorage.
 */
export const ensureDefaultCity = async (
	userData: AuthPayload,
): Promise<AuthPayload> => {
	const existingCity = userData?.user?.address?.city;
	if (existingCity) return userData;

	const detected = await detectCityFromLocation();
	const city = detected?.city || DEFAULT_CITY;
	const street = detected?.street;
	const state = detected?.region || DEFAULT_STATE;

	const patched: AuthPayload = {
		...userData,
		user: {
			...userData.user,
			address: {
				...userData.user?.address,
				city,
				...(street ? { street } : {}),
				state,
			},
		},
	};

	// Best-effort background sync so the backend/profile also reflects the
	// resolved address; failures are silently ignored (local value already set).
	AuthService.updateProfile({
		address: { city, ...(street ? { street } : {}), ...(state ? { state } : {}) },
	}).catch(() => {});

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

import { AuthService } from "@/services/api";
import type { User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

export default getUserCity;

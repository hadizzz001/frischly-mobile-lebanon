import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import * as Location from "expo-location";

// Normalizes a city name for comparison: lowercase, strip diacritics, drop
// common suffixes like "Governorate"/"District" that reverse-geocoding
// services sometimes append, and trim whitespace.
const normalize = (value: unknown): string =>
	String(value || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/\b(governorate|district|caza|qada)\b/g, "")
		.replace(/[^a-z\s]/g, "")
		.replace(/\s+/g, " ")
		.trim();

/**
 * Matches a raw city/region string (as returned by reverse geocoding) against
 * our fixed LEBANESE_CITIES list. Tries an exact match first, then a
 * substring match in either direction (handles cases like "Beirut
 * Governorate" -> "Beirut", or "Greater Beirut" -> "Beirut").
 *
 * @returns {string|null} A value from LEBANESE_CITIES, or null if no
 * reasonable match was found.
 */
export const matchLebaneseCity = (
	...candidates: (string | null | undefined)[]
): string | null => {
	for (const raw of candidates) {
		const normalized = normalize(raw);
		if (!normalized) continue;

		// Exact match.
		const exact = LEBANESE_CITIES.find((c) => normalize(c) === normalized);
		if (exact) return exact;

		// Substring match either direction (longest city name first so e.g.
		// "Bint Jbeil" wins over any partial overlap with a shorter name).
		const bySubstring = [...LEBANESE_CITIES]
			.sort((a, b) => b.length - a.length)
			.find((c) => {
				const nc = normalize(c);
				return normalized.includes(nc) || nc.includes(normalized);
			});
		if (bySubstring) return bySubstring;
	}
	return null;
};

/**
 * Attempts to auto-detect the user's Lebanese city (plus street/region as a
 * bonus) using the device's GPS + reverse geocoding. Designed to fail
 * silently — returns null whenever permission is denied, location services
 * are off, or nothing resolves, so callers can just fall back to manual
 * selection without showing scary errors.
 *
 * @returns {Promise<{ city: string, street?: string, region?: string } | null>}
 */
export const detectCityFromLocation = async (): Promise<{
	city: string;
	street?: string;
	region?: string;
} | null> => {
	try {
		const { status: existingStatus } =
			await Location.getForegroundPermissionsAsync();
		let finalStatus = existingStatus;

		if (finalStatus !== "granted") {
			const { status } = await Location.requestForegroundPermissionsAsync();
			finalStatus = status;
		}

		if (finalStatus !== "granted") return null;

		const position = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		const results = await Location.reverseGeocodeAsync({
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		});

		const hit = results?.[0];
		if (!hit) return null;

		const city = matchLebaneseCity(hit.city, hit.subregion, hit.district, hit.region);
		if (!city) return null;

		const street = [hit.streetNumber, hit.street].filter(Boolean).join(" ");

		return { city, street: street || undefined, region: hit.region || undefined };
	} catch (e) {
		console.warn("City auto-detect failed:", e);
		return null;
	}
};

export default detectCityFromLocation;

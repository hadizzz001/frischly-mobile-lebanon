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

// Reverse-geocoding services often return alternate spellings/transliterations
// for the same Lebanese town (e.g. iOS/Google may say "Jbeil" for what our
// list calls "Byblos"). Map those known aliases to the canonical name in
// LEBANESE_CITIES so exact matching picks the right one before any fuzzy
// substring logic even runs.
const CITY_ALIASES: Record<string, string> = {
	jbeil: "Byblos",
	saida: "Sidon",
	sour: "Tyre",
	zahleh: "Zahle",
	baabdat: "Baabda",
	broumana: "Broummana",
	bcharreh: "Bcharre",
	bsharri: "Bcharre",
	bsharre: "Bcharre",
};

/**
 * Matches a raw city/region string (as returned by reverse geocoding) against
 * our fixed LEBANESE_CITIES list. Tries an exact match first (including known
 * alias spellings), then a word-boundary-aware substring match — but only in
 * the direction of "does the candidate city's full name appear as a whole
 * word/phrase inside the input", never the reverse. That reverse direction
 * (checking whether a *longer* city name merely contains the shorter input as
 * a substring, e.g. "Jbeil" being contained inside "Bint Jbeil") is what
 * previously caused a pin dropped in Jbeil to be misidentified as "Bint
 * Jbeil", so it has been removed.
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

		// Known alias (e.g. "Jbeil" -> "Byblos").
		const alias = CITY_ALIASES[normalized];
		if (alias) return alias;

		// Exact match.
		const exact = LEBANESE_CITIES.find((c) => normalize(c) === normalized);
		if (exact) return exact;

		// Word-boundary substring match: the city name must appear as a whole
		// word/phrase within the (typically longer/more verbose) geocoded
		// string — e.g. "Greater Beirut Area" -> "Beirut". Longest city names
		// are checked first so more specific names (e.g. "Bint Jbeil") are
		// preferred over shorter ones that happen to also match a word within
		// them (e.g. "Jbeil" would never match here since it's a different,
		// standalone alias handled above).
		const bySubstring = [...LEBANESE_CITIES]
			.sort((a, b) => b.length - a.length)
			.find((c) => {
				const nc = normalize(c);
				if (!nc) return false;
				const pattern = new RegExp(`\\b${nc.replace(/\s+/g, "\\s+")}\\b`);
				return pattern.test(normalized);
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
 * @returns {Promise<{ city: string, street?: string, region?: string, latitude?: number, longitude?: number } | null>}
 */
export const detectCityFromLocation = async (): Promise<{
	city: string;
	street?: string;
	region?: string;
	latitude?: number;
	longitude?: number;
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
			accuracy: Location.Accuracy.Highest,
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

		return {
			city,
			street: street || undefined,
			region: hit.region || undefined,
			latitude: position.coords.latitude,
			longitude: position.coords.longitude,
		};
	} catch (e) {
		console.warn("City auto-detect failed:", e);
		return null;
	}
};

/**
 * Reverse-geocodes a raw lat/lng pair back into a Lebanese city/street/region
 * — used by the map pin picker so dragging the pin also keeps the shopper's
 * city/street text fields in sync with the exact point they chose.
 */
export const reverseGeocodePoint = async (
	latitude: number,
	longitude: number
): Promise<{ city?: string; street?: string; region?: string } | null> => {
	try {
		const results = await Location.reverseGeocodeAsync({ latitude, longitude });
		const hit = results?.[0];
		if (!hit) return null;
		const city = matchLebaneseCity(hit.city, hit.subregion, hit.district, hit.region) || undefined;
		const street = [hit.streetNumber, hit.street].filter(Boolean).join(" ");
		return { city, street: street || undefined, region: hit.region || undefined };
	} catch (e) {
		console.warn("Reverse geocode failed:", e);
		return null;
	}
};

// Approximate center coordinates for each town in LEBANESE_CITIES. Used to
// snap the map pin to a sensible starting point whenever the shopper picks a
// city manually from the dropdown (instead of dragging the pin), so the two
// controls always stay in sync in both directions.
const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
	Beirut: { latitude: 33.8938, longitude: 35.5018 },
	Tripoli: { latitude: 34.4367, longitude: 35.8497 },
	Sidon: { latitude: 33.5606, longitude: 35.3758 },
	Tyre: { latitude: 33.2704, longitude: 35.2038 },
	Nabatieh: { latitude: 33.3789, longitude: 35.4839 },
	Jounieh: { latitude: 33.9808, longitude: 35.6178 },
	Zahle: { latitude: 33.8463, longitude: 35.9019 },
	Baalbek: { latitude: 34.0059, longitude: 36.2181 },
	Byblos: { latitude: 34.1232, longitude: 35.6512 },
	Aley: { latitude: 33.8106, longitude: 35.5972 },
	Baabda: { latitude: 33.8339, longitude: 35.5442 },
	Zgharta: { latitude: 34.3986, longitude: 35.8961 },
	"Bint Jbeil": { latitude: 33.1211, longitude: 35.4256 },
	Batroun: { latitude: 34.2553, longitude: 35.6581 },
	Hermel: { latitude: 34.3936, longitude: 36.3872 },
	Jezzine: { latitude: 33.5417, longitude: 35.5847 },
	Marjeyoun: { latitude: 33.3606, longitude: 35.5919 },
	Rashaya: { latitude: 33.5017, longitude: 35.8508 },
	Hasbaya: { latitude: 33.3986, longitude: 35.6839 },
	Bcharre: { latitude: 34.2508, longitude: 36.0114 },
	Amioun: { latitude: 34.3011, longitude: 35.8306 },
	Halba: { latitude: 34.5386, longitude: 36.0781 },
	Chtaura: { latitude: 33.8228, longitude: 35.8547 },
	Bhamdoun: { latitude: 33.7961, longitude: 35.6497 },
	Broummana: { latitude: 33.8722, longitude: 35.6272 },
	Dbayeh: { latitude: 33.9439, longitude: 35.5806 },
	Antelias: { latitude: 33.9147, longitude: 35.5847 },
	Jdeideh: { latitude: 33.8956, longitude: 35.5636 },
	Zalka: { latitude: 33.9058, longitude: 35.5622 },
	Ghazieh: { latitude: 33.5064, longitude: 35.3689 },
	Damour: { latitude: 33.7297, longitude: 35.4478 },
	Anjar: { latitude: 33.7256, longitude: 35.9319 },
	Rayak: { latitude: 33.8508, longitude: 35.9853 },
};

/**
 * Returns an approximate {latitude, longitude} for a Lebanese city name (as
 * picked from the LEBANESE_CITIES dropdown), or null if unknown. Used to keep
 * the map pin in sync when the shopper edits the city manually instead of
 * dragging the pin.
 */
export const getCityCoordinates = (
	city: string | null | undefined
): { latitude: number; longitude: number } | null => {
	if (!city) return null;
	return CITY_COORDINATES[city] || null;
};

export default detectCityFromLocation;

// Geocoding fallback (mirrors public/riderslocation.html).
//
// Riders frequently have no live GPS (currentLocation), so — exactly like the
// admin dashboard — we resolve an approximate position from the rider's address,
// city, or service zone via Nominatim (OpenStreetMap), with an on-device cache.

import type { RiderLocationInfo } from "@/services/api/orderService";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
	GeoCache,
	LatLng,
	ResolvedLocation,
} from "@/types/utils/geocode.types";

export type { GeoCache, LatLng, ResolvedLocation };

const GEO_CACHE_KEY = "frischly_geo_cache_v1";

const getGeoCache = async (): Promise<GeoCache> => {
	try {
		const raw = await AsyncStorage.getItem(GEO_CACHE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
};

const setGeoCache = async (cache: GeoCache) => {
	try {
		await AsyncStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
	} catch {}
};

export const geocodeAddress = async (q?: string): Promise<LatLng | null> => {
	if (!q) return null;
	const key = q.toLowerCase().trim();
	const cache = await getGeoCache();
	if (cache[key]) return cache[key];
	try {
		const r = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
				q,
			)}`,
			{ headers: { Accept: "application/json", "User-Agent": "FrischlyApp/1.0" } },
		);
		const arr = await r.json();
		if (Array.isArray(arr) && arr.length) {
			const hit = { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) };
			if (Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) {
				cache[key] = hit;
				await setGeoCache(cache);
				return hit;
			}
		}
	} catch (e) {
		console.warn("Geocode failed:", e);
	}
	return null;
};

// Resolution order matches the dashboard: live GPS -> full address -> city -> zone.
export const resolveRiderLocation = async (
	data: RiderLocationInfo,
): Promise<ResolvedLocation | null> => {
	if (
		data?.hasLocation &&
		Number.isFinite(data.latitude) &&
		Number.isFinite(data.longitude)
	) {
		return {
			lat: data.latitude as number,
			lng: data.longitude as number,
			source: "live",
		};
	}

	const addr = data?.address || {};
	const full = [addr.street, addr.city, addr.region, addr.country || "Lebanon"]
		.filter(Boolean)
		.join(", ");
	if (full) {
		const hit = await geocodeAddress(full);
		if (hit) return { ...hit, source: "address" };
	}
	if (addr.city) {
		const hit = await geocodeAddress(`${addr.city}, Lebanon`);
		if (hit) return { ...hit, source: "city" };
	}
	if (Array.isArray(data?.zones) && data.zones.length) {
		const hit = await geocodeAddress(`${data.zones[0]}, Lebanon`);
		if (hit) return { ...hit, source: "zone" };
	}
	return null;
};

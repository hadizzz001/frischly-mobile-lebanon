/**
 * Small geo helpers (haversine distance + "point inside any delivery region")
 * mirroring the server's `src/utils/geo.js`, kept dependency-free.
 */

export interface DeliveryRegion {
	latitude?: number;
	longitude?: number;
	radiusKm?: number;
}

const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Distance in kilometers between two lat/lng points. */
export function haversineDistanceKm(
	lat1: number,
	lon1: number,
	lat2: number,
	lon2: number,
): number {
	if (
		typeof lat1 !== "number" ||
		typeof lon1 !== "number" ||
		typeof lat2 !== "number" ||
		typeof lon2 !== "number" ||
		Number.isNaN(lat1) ||
		Number.isNaN(lon1) ||
		Number.isNaN(lat2) ||
		Number.isNaN(lon2)
	) {
		return Infinity;
	}
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(toRad(lat1)) *
			Math.cos(toRad(lat2)) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return EARTH_RADIUS_KM * c;
}

/**
 * Does a point (lat/lng) fall inside ANY of the given delivery regions
 * (each `{ latitude, longitude, radiusKm }` — a map pin + radius circle)?
 */
export function pointInAnyRegion(
	lat: number | null | undefined,
	lng: number | null | undefined,
	regions: DeliveryRegion[] | null | undefined,
): boolean {
	if (!Array.isArray(regions) || !regions.length) return false;
	if (typeof lat !== "number" || typeof lng !== "number") return false;
	return regions.some((region) => {
		if (
			!region ||
			typeof region.latitude !== "number" ||
			typeof region.longitude !== "number" ||
			typeof region.radiusKm !== "number" ||
			region.radiusKm <= 0
		) {
			return false;
		}
		const distance = haversineDistanceKm(
			lat,
			lng,
			region.latitude,
			region.longitude,
		);
		return distance <= region.radiusKm;
	});
}

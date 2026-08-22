export type LatLng = { lat: number; lng: number };
export type ResolvedLocation = LatLng & { source: string };
export type GeoCache = Record<string, LatLng>;

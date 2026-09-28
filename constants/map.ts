// Shared map defaults. Both the rider-tracking map and the address picker start
// from the same fallback centre and load the same basemap so they stay
// visually consistent.

/** Default map center (Beirut) used until we have a real position. */
export const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };

// ---------------------------------------------------------------------------
// Basemap tiles
//
// Deliberately NOT tile.openstreetmap.org. Those servers are volunteer-run and
// the OSM Foundation's tile usage policy forbids distributing an app that
// loads tiles from them. They enforce it by answering any request that has
// no Referer with an "Access blocked" tile — and a WebView rendering inline
// HTML has no origin, so it can never send one. (CARTO's keyless basemaps
// were the usual fallback but now watermark every tile "API KEY REQUIRED".)
//
// Esri's World Street Map is a keyless raster service licensed for use in
// apps on the condition that its attribution is shown — the maps render it
// in a compact Leaflet attribution control. It's OpenStreetMap-derived in
// most of the world, so it looks familiar. If it's ever retired or we outgrow
// fair use, swap these four values for a keyed provider (Geoapify, MapTiler,
// Stadia, …) — nothing else needs to change.
// ---------------------------------------------------------------------------

/** Leaflet-style tile URL template. Esri orders the path {z}/{y}/{x}. */
export const TILE_URL =
	"https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
export const TILE_SUBDOMAINS = "";
/** The service goes to 23, but detail past 19 is sparse outside big cities. */
export const TILE_MAX_ZOOM = 19;
/** Required by Esri's terms — always show it. */
export const TILE_ATTRIBUTION =
	'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, HERE, Garmin, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Appended to the WebView's default User-Agent so tile/CDN requests identify
 * this app instead of looking like anonymous WebView traffic — tile providers
 * ask for this, and it's what lets them contact us rather than block us if a
 * request pattern ever looks wrong.
 */
export const MAP_WEBVIEW_APP_NAME = "FrischlyLebanon";

/**
 * The Leaflet snippet that adds the basemap to `map` — shared by every
 * in-app map page so they can never drift onto different providers.
 */
export const leafletTileLayerJs = (mapVar = "map") =>
	`L.tileLayer(${JSON.stringify(TILE_URL)}, {
    subdomains: ${JSON.stringify(TILE_SUBDOMAINS)},
    maxZoom: ${TILE_MAX_ZOOM},
    attribution: ${JSON.stringify(TILE_ATTRIBUTION)},
  }).addTo(${mapVar});`;

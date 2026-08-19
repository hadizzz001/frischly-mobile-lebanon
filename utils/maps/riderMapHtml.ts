import { DEFAULT_CENTER } from "@/constants/map";

/**
 * A self-contained Leaflet/OpenStreetMap page that exposes a global
 * `updateRider(lat, lng)` that the React Native side calls (via
 * injectJavaScript) every time a fresh location arrives — so the marker moves
 * live without ever reloading the page.
 */
export const buildMapHtml = (lat: number, lng: number) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .rider-pin {
    background: #22a45d; width: 22px; height: 22px; border-radius: 50%;
    border: 3px solid #fff; box-shadow: 0 0 0 2px #22a45d;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var startLat = ${Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat};
  var startLng = ${Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng};
  var map = L.map('map', { zoomControl: true, attributionControl: false })
              .setView([startLat, startLng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
  }).addTo(map);

  var riderIcon = L.divIcon({ className: '', html: '<div class="rider-pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
  var marker = null;

  window.updateRider = function (la, ln) {
    if (la == null || ln == null) return true;
    var ll = [la, ln];
    if (!marker) {
      marker = L.marker(ll, { icon: riderIcon }).addTo(map);
    } else {
      marker.setLatLng(ll);
    }
    map.setView(ll, map.getZoom() < 13 ? 15 : map.getZoom());
    return true;
  };

  ${
		Number.isFinite(lat) && Number.isFinite(lng)
			? "window.updateRider(startLat, startLng);"
			: ""
	}
</script>
</body>
</html>`;

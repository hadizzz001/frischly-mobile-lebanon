import { DEFAULT_CENTER } from "@/constants/map";

/**
 * A self-contained Leaflet/OpenStreetMap page with a single DRAGGABLE marker.
 * Tapping anywhere on the map also moves the marker there. The page posts
 * `{ lat, lng }` back to React Native (via window.ReactNativeWebView) every
 * time the marker moves, so the picker always knows the exact chosen point.
 */
export const buildPickerHtml = (lat: number, lng: number) => `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #map { height: 100%; margin: 0; padding: 0; }
  .pin {
    background: #f4bb26; width: 26px; height: 26px; border-radius: 50% 50% 50% 0;
    border: 3px solid #fff; transform: rotate(-45deg);
    box-shadow: 0 2px 6px rgba(0,0,0,.4);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var lat = ${Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat};
  var lng = ${Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng};
  var map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lng], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  var pinIcon = L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [26, 26], iconAnchor: [13, 26] });
  var marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);

  function post(ll) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: ll.lat, lng: ll.lng }));
    }
  }

  marker.on('dragend', function () { post(marker.getLatLng()); });
  map.on('click', function (e) {
    marker.setLatLng(e.latlng);
    post(e.latlng);
  });

  // Let React Native re-center the map + marker (e.g. after "Use my location").
  window.setPoint = function (la, ln) {
    var ll = [la, ln];
    marker.setLatLng(ll);
    map.setView(ll, Math.max(map.getZoom(), 15));
    return true;
  };
</script>
</body>
</html>`;

import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// Default map center (Beirut) used until we have a real position.
const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };

export interface PickedLocation {
	latitude: number;
	longitude: number;
}

interface LocationPickerMapProps {
	visible: boolean;
	initialLocation?: PickedLocation | null;
	onClose: () => void;
	onConfirm: (location: PickedLocation) => void;
	title?: string;
	confirmLabel?: string;
	useMyLocationLabel?: string;
}

// A self-contained Leaflet/OpenStreetMap page with a single DRAGGABLE marker.
// Tapping anywhere on the map also moves the marker there. The page posts
// `{ lat, lng }` back to React Native (via window.ReactNativeWebView) every
// time the marker moves, so the picker always knows the exact chosen point.
const buildPickerHtml = (lat: number, lng: number) => `<!DOCTYPE html>
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

/**
 * LocationPickerMap
 *
 * Full-screen modal map picker. Shows a draggable pin (defaults to the
 * shopper's current GPS position, or `initialLocation` if provided/edited
 * before) that the shopper can drag or tap-to-move to mark their exact
 * delivery location. Confirming returns `{ latitude, longitude }`.
 */
export default function LocationPickerMap({
	visible,
	initialLocation,
	onClose,
	onConfirm,
	title = "Set your exact location",
	confirmLabel = "Confirm location",
	useMyLocationLabel = "Use my current location",
}: LocationPickerMapProps) {
	const webRef = useRef<WebView>(null);
	const [locating, setLocating] = useState(false);
	const [point, setPoint] = useState<PickedLocation>(
		initialLocation && Number.isFinite(initialLocation.latitude)
			? initialLocation
			: { latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng }
	);
	const [html, setHtml] = useState(() =>
		buildPickerHtml(point.latitude, point.longitude)
	);

	// The initial `point`/`html` above only reflect whatever `initialLocation`
	// was at the very first mount. Since this modal is typically mounted once
	// and just toggled via `visible`, a later-arriving GPS fix (e.g. the
	// register screen's auto-detect resolving async, or a fresh manual "use my
	// location" tap before reopening) would never be picked up otherwise —
	// the map kept opening at the stale/default position. Re-sync both every
	// time the picker opens so it always starts centered on the caller's
	// latest known accurate location.
	useEffect(() => {
		if (!visible) return;
		const next =
			initialLocation && Number.isFinite(initialLocation.latitude)
				? initialLocation
				: { latitude: DEFAULT_CENTER.lat, longitude: DEFAULT_CENTER.lng };
		setPoint(next);
		setHtml(buildPickerHtml(next.latitude, next.longitude));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [visible]);

	const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			if (Number.isFinite(data?.lat) && Number.isFinite(data?.lng)) {
				setPoint({ latitude: data.lat, longitude: data.lng });
			}
		} catch {
			// ignore malformed messages
		}
	}, []);

	const useMyLocation = async () => {
		setLocating(true);
		try {
			const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
			let finalStatus = existingStatus;
			if (finalStatus !== "granted") {
				const { status } = await Location.requestForegroundPermissionsAsync();
				finalStatus = status;
			}
			if (finalStatus !== "granted") return;

			const position = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});
			const { latitude, longitude } = position.coords;
			setPoint({ latitude, longitude });
			webRef.current?.injectJavaScript(
				`window.setPoint && window.setPoint(${latitude}, ${longitude}); true;`
			);
		} catch (e) {
			console.warn("Use-my-location failed:", e);
		} finally {
			setLocating(false);
		}
	};

	return (
		<Modal visible={visible} animationType="slide" onRequestClose={onClose}>
			<SafeAreaView style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={onClose} style={styles.headerBtn}>
						<Feather name="x" size={22} color="#000" />
					</TouchableOpacity>
					<Text style={styles.headerTitle}>{title}</Text>
					<View style={styles.headerBtn} />
				</View>

				<WebView
					ref={webRef}
					originWhitelist={["*"]}
					source={{ html }}
					onMessage={handleMessage}
					style={{ flex: 1 }}
				/>

				<View style={styles.footer}>
					<TouchableOpacity
						onPress={useMyLocation}
						disabled={locating}
						style={styles.secondaryBtn}
					>
						{locating ? (
							<ActivityIndicator size="small" color="#000" />
						) : (
							<>
								<Feather name="crosshair" size={18} color="#000" />
								<Text style={styles.secondaryBtnText}>{useMyLocationLabel}</Text>
							</>
						)}
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => onConfirm(point)}
						style={styles.confirmBtn}
					>
						<Text style={styles.confirmBtnText}>{confirmLabel}</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		</Modal>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	headerBtn: { width: 34, alignItems: "center", justifyContent: "center" },
	headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
	footer: {
		flexDirection: "row",
		gap: 10,
		padding: 14,
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	secondaryBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		flex: 1,
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
		paddingVertical: 13,
	},
	secondaryBtnText: { color: "#000", fontWeight: "600" },
	confirmBtn: {
		flex: 1,
		backgroundColor: "#f4bb26",
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 13,
	},
	confirmBtnText: { color: "#000", fontWeight: "700" },
});

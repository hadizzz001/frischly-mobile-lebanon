import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const API_BASE_URL = "https://frischly-dash-leb.onrender.com/api";
const POLL_MS = 12000; // refresh the rider's position every 12s

// Default map center (Beirut) used until we have a real rider position.
const DEFAULT_CENTER = { lat: 33.8938, lng: 35.5018 };

// A self-contained Leaflet/OpenStreetMap page. It exposes a global
// `updateRider(lat, lng)` that the React Native side calls (via
// injectJavaScript) every time a fresh location arrives — so the marker moves
// live without ever reloading the page.
const buildMapHtml = (lat, lng) => `<!DOCTYPE html>
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

// ---- Geocoding fallback (mirrors public/riderslocation.html) ----
// Riders frequently have no live GPS (currentLocation), so — exactly like the
// admin dashboard — we resolve an approximate position from the rider's address,
// city, or service zone via Nominatim (OpenStreetMap), with an on-device cache.
const GEO_CACHE_KEY = "frischly_geo_cache_v1";

const getGeoCache = async () => {
	try {
		const raw = await AsyncStorage.getItem(GEO_CACHE_KEY);
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
};

const setGeoCache = async (cache) => {
	try {
		await AsyncStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
	} catch {}
};

const geocodeAddress = async (q) => {
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
const resolveRiderLocation = async (data) => {
	if (
		data?.hasLocation &&
		Number.isFinite(data.latitude) &&
		Number.isFinite(data.longitude)
	) {
		return { lat: data.latitude, lng: data.longitude, source: "live" };
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

export default function TrackOrderScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { id, orderNumber } = useLocalSearchParams();

	const webRef = useRef(null);
	const webReadyRef = useRef(false);
	const pendingCoordsRef = useRef(null);
	// Built ONCE (default center, no marker) so the WebView never reloads on a
	// poll — the marker is always driven live via injectJavaScript instead.
	const htmlRef = useRef(buildMapHtml(NaN, NaN));

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [info, setInfo] = useState(null); // the rider-location payload
	// Resolved coordinates actually shown on the map: { lat, lng, source }.
	const [resolved, setResolved] = useState(null);

	// Push the latest coordinates into the WebView (or queue them until it's ready).
	const pushToMap = (lat, lng) => {
		if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
		if (webReadyRef.current && webRef.current) {
			webRef.current.injectJavaScript(
				`window.updateRider && window.updateRider(${lat}, ${lng}); true;`,
			);
		} else {
			pendingCoordsRef.current = { lat, lng };
		}
	};

	const fetchLocation = async () => {
		try {
			const userData = await AsyncStorage.getItem("userData");
			const parsed = userData ? JSON.parse(userData) : null;
			const token = parsed?.token;
			if (!token) {
				setError(t("notAuthenticated"));
				setLoading(false);
				return;
			}

			const res = await fetch(`${API_BASE_URL}/orders/${id}/rider-location`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			});
			const json = await res.json();

			if (!res.ok || !json?.success) {
				setError(json?.message || t("errorOccurred"));
				setLoading(false);
				return;
			}

			setError("");
			setInfo(json.data);

			if (json.data?.hasRider) {
				const r = await resolveRiderLocation(json.data);
				setResolved(r);
				if (r) pushToMap(r.lat, r.lng);
			} else {
				setResolved(null);
			}
		} catch (e) {
			console.error("rider-location error", e);
			setError(t("errorOccurred"));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLocation();
		const timer = setInterval(fetchLocation, POLL_MS);
		return () => clearInterval(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const openInMaps = () => {
		if (!resolved) return;
		const { lat, lng } = resolved;
		// Same OpenStreetMap link used by the admin riderslocation dashboard.
		const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
		Linking.openURL(url).catch(() => {});
	};

	const sourceLabel = (s) => {
		switch (s) {
			case "live":
				return t("locLive");
			case "address":
				return t("locAddress");
			case "city":
				return t("locCity");
			case "zone":
				return t("locZone");
			default:
				return "";
		}
	};

	const callRider = () => {
		const phone = info?.rider?.phone;
		if (!phone) return;
		Linking.openURL(`tel:${phone}`).catch(() => {});
	};

	const formatTime = (iso) => {
		if (!iso) return "";
		try {
			const d = new Date(iso);
			return d.toLocaleString();
		} catch {
			return "";
		}
	};

	const initialHtml = htmlRef.current;

	const renderBody = () => {
		if (loading && !info) {
			return (
				<View style={styles.centerBox}>
					<ActivityIndicator size="large" color="#22a45d" />
					<Text style={styles.muted}>{t("loadingLocation")}</Text>
				</View>
			);
		}

		if (error) {
			return (
				<View style={styles.centerBox}>
					<Feather name="alert-circle" size={40} color="#c0392b" />
					<Text style={styles.errorText}>{error}</Text>
					<TouchableOpacity style={styles.retryBtn} onPress={fetchLocation}>
						<Text style={styles.retryText}>{t("retry")}</Text>
					</TouchableOpacity>
				</View>
			);
		}

		if (info && !info.hasRider) {
			return (
				<View style={styles.centerBox}>
					<Feather name="user-x" size={40} color="#888" />
					<Text style={styles.muted}>{t("noRiderAssigned")}</Text>
				</View>
			);
		}

		// Rider assigned: show the map (live) + an info card.
		return (
			<View style={styles.flex}>
				<View style={styles.mapWrap}>
					<WebView
						ref={webRef}
						originWhitelist={["*"]}
						source={{ html: initialHtml }}
						style={styles.map}
						onLoadEnd={() => {
							webReadyRef.current = true;
							const pending = pendingCoordsRef.current;
							if (pending) {
								pushToMap(pending.lat, pending.lng);
								pendingCoordsRef.current = null;
							}
						}}
						javaScriptEnabled
						domStorageEnabled
					/>

					{resolved ? (
						<View style={styles.sourceBadge}>
							<View
								style={[
									styles.sourceDot,
									resolved.source === "live" && styles.sourceDotLive,
								]}
							/>
							<Text style={styles.sourceBadgeText}>
								{sourceLabel(resolved.source)}
							</Text>
						</View>
					) : (
						<View style={styles.noLocOverlay}>
							<Feather name="map-pin" size={28} color="#fff" />
							<Text style={styles.noLocText}>{t("locationNotAvailable")}</Text>
						</View>
					)}
				</View>

				<View style={styles.card}>
					<View style={styles.riderRow}>
						<View style={styles.avatar}>
							<Feather name="truck" size={20} color="#fff" />
						</View>
						<View style={styles.flex}>
							<Text style={styles.riderName}>
								{info?.rider?.name || t("driver")}
							</Text>
							<Text style={styles.muted}>
								{[info?.rider?.vehicleType, info?.rider?.vehicleNumber]
									.filter(Boolean)
									.join(" • ") || t("onTheWay")}
							</Text>
						</View>
						{info?.rider?.phone ? (
							<TouchableOpacity style={styles.callBtn} onPress={callRider}>
								<Feather name="phone" size={18} color="#fff" />
							</TouchableOpacity>
						) : null}
					</View>

					{info?.lastUpdated ? (
						<Text style={styles.updatedText}>
							{t("lastUpdated")}: {formatTime(info.lastUpdated)}
						</Text>
					) : null}

					<TouchableOpacity
						style={[styles.mapsBtn, !resolved && styles.mapsBtnDisabled]}
						onPress={openInMaps}
						disabled={!resolved}
					>
						<Feather name="navigation" size={18} color="#fff" />
						<Text style={styles.mapsBtnText}>{t("openInMaps")}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
			<Stack.Screen options={{ headerShown: false }} />

			<View style={styles.header}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
					<Feather name="arrow-left" size={22} color="#111" />
				</TouchableOpacity>
				<Text style={styles.headerTitle} numberOfLines={1}>
					{t("trackDriver")}
					{orderNumber ? ` · #${orderNumber}` : ""}
				</Text>
				<View style={styles.backBtn} />
			</View>

			{renderBody()}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: "#fff" },
	flex: { flex: 1 },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
	headerTitle: {
		flex: 1,
		textAlign: "center",
		fontSize: 16,
		fontWeight: "700",
		color: "#111",
	},
	centerBox: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		gap: 12,
	},
	muted: { color: "#777", fontSize: 14, textAlign: "center" },
	errorText: { color: "#c0392b", fontSize: 15, textAlign: "center" },
	retryBtn: {
		marginTop: 8,
		backgroundColor: "#22a45d",
		paddingHorizontal: 20,
		paddingVertical: 10,
		borderRadius: 8,
	},
	retryText: { color: "#fff", fontWeight: "700" },
	mapWrap: { flex: 1, position: "relative" },
	map: { flex: 1 },
	noLocOverlay: {
		position: "absolute",
		top: 12,
		left: 12,
		right: 12,
		backgroundColor: "rgba(17,17,17,0.8)",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		paddingVertical: 10,
		borderRadius: 10,
	},
	noLocText: { color: "#fff", fontWeight: "600" },
	sourceBadge: {
		position: "absolute",
		top: 12,
		left: 12,
		flexDirection: "row",
		alignItems: "center",
		gap: 7,
		backgroundColor: "rgba(17,17,17,0.82)",
		paddingVertical: 7,
		paddingHorizontal: 12,
		borderRadius: 20,
	},
	sourceDot: {
		width: 9,
		height: 9,
		borderRadius: 5,
		backgroundColor: "#f1c40f",
	},
	sourceDotLive: { backgroundColor: "#22a45d" },
	sourceBadgeText: { color: "#fff", fontWeight: "600", fontSize: 12 },
	card: {
		backgroundColor: "#fff",
		paddingHorizontal: 16,
		paddingTop: 14,
		paddingBottom: 16,
		borderTopWidth: 1,
		borderTopColor: "#eee",
		gap: 12,
	},
	riderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
	avatar: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#22a45d",
		justifyContent: "center",
		alignItems: "center",
	},
	riderName: { fontSize: 16, fontWeight: "700", color: "#111" },
	callBtn: {
		width: 42,
		height: 42,
		borderRadius: 21,
		backgroundColor: "#2d8cff",
		justifyContent: "center",
		alignItems: "center",
	},
	updatedText: { color: "#999", fontSize: 12 },
	mapsBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#22a45d",
		paddingVertical: 13,
		borderRadius: 10,
	},
	mapsBtnDisabled: { backgroundColor: "#cccccc" },
	mapsBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

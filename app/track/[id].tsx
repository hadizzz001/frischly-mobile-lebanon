import { RIDER_TRACKING_POLL_MS as POLL_MS } from "@/constants/timing";
import { useTranslation } from "@/contexts/TranslationContext";
import { ApiError, OrderService } from "@/services/api";
import type { RiderLocationInfo } from "@/services/api/orderService";
import { styles } from "@/styles/app/track/[id].styles";
import type { LatLng, ResolvedLocation } from "@/utils/geocode";
import { resolveRiderLocation } from "@/utils/geocode";
import { buildMapHtml } from "@/utils/maps/riderMapHtml";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Linking,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function TrackOrderScreen() {
	const { t } = useTranslation();
	const router = useRouter();
	const { id, orderNumber } = useLocalSearchParams<{
		id: string;
		orderNumber?: string;
	}>();

	const webRef = useRef<WebView>(null);
	const webReadyRef = useRef(false);
	const pendingCoordsRef = useRef<LatLng | null>(null);
	// Built ONCE (default center, no marker) so the WebView never reloads on a
	// poll — the marker is always driven live via injectJavaScript instead.
	const htmlRef = useRef(buildMapHtml(NaN, NaN));

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [info, setInfo] = useState<RiderLocationInfo | null>(null); // the rider-location payload
	// Resolved coordinates actually shown on the map: { lat, lng, source }.
	const [resolved, setResolved] = useState<ResolvedLocation | null>(null);

	// Push the latest coordinates into the WebView (or queue them until it's ready).
	const pushToMap = (lat: number, lng: number) => {
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

			const res = await OrderService.riderLocation(id);

			if (!res?.success) {
				setError(res?.message || t("errorOccurred"));
				setLoading(false);
				return;
			}

			setError("");
			setInfo(res.data);

			if (res.data?.hasRider) {
				const r = await resolveRiderLocation(res.data);
				setResolved(r);
				if (r) pushToMap(r.lat, r.lng);
			} else {
				setResolved(null);
			}
		} catch (e) {
			if (e instanceof ApiError) {
				setError(
					(e.payload as { message?: string })?.message || t("errorOccurred"),
				);
			} else {
				console.error("rider-location error", e);
				setError(t("errorOccurred"));
			}
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

	const sourceLabel = (s?: string) => {
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

	const formatTime = (iso?: string) => {
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
					{!!info.orderStatus && (
						<Text style={styles.muted}>
							{t("status")}: {info.orderStatus}
						</Text>
					)}
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

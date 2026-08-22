import { globalStyles } from "@/constants/GlobalStyles";
import { DEFAULT_CENTER } from "@/constants/map";
import { styles } from "@/styles/components/LocationPickerMap.styles";
import { buildPickerHtml } from "@/utils/maps/pickerMapHtml";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import type {
	LocationPickerMapProps,
	PickedLocation,
} from "@/types/components/LocationPickerMap.types";

export type { PickedLocation };

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
					style={globalStyles.flex1}
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

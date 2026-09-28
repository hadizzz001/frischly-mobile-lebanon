// Address creation / editing sheet used at checkout (and reusable anywhere).
//
// Lebanese couriers navigate by pin + landmark, not postal codes, so the form
// is: map pin (react-native-maps-free WebView picker already in the app),
// city (derived from the pin), street/area, building & floor, and a nearby
// landmark. The three text lines are folded into the profile's single
// `street` field ("street · building · near landmark") because the backend
// address schema has no separate slots for them.
import { Lock, MapPin, MapPinned } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import LocationPickerMap, { type PickedLocation } from "@/components/LocationPickerMap";
import AppBottomSheet from "@/components/ui/AppBottomSheet";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/AddressSheet.styles";
import type { AddressSheetProps } from "@/types/components/AddressSheet.types";
import { getStateForCity, reverseGeocodePoint } from "@/utils/cityDetection";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { STREET_SEP as SEP, formatStreetLine, saveUserAddress } from "@/utils/userAddress";

/** Split a stored street line back into its three parts (best effort). */
const splitStreet = (address?: { street?: string; city?: string } | null) => {
	// Strip the city-name placeholder so it never gets edited back in as a street.
	const parts = formatStreetLine(address).split(SEP);
	return { street: parts[0] || "", building: parts[1] || "", landmark: parts[2] || "" };
};

export default function AddressSheet({ visible, onClose, address, onSaved, lockCity = false }: AddressSheetProps) {
	const { t } = useTranslation();
	const initial = splitStreet(address);
	const [city, setCity] = useState(address?.city || "");
	const [street, setStreet] = useState(initial.street);
	const [building, setBuilding] = useState(initial.building);
	const [landmark, setLandmark] = useState(initial.landmark);
	const [pin, setPin] = useState<PickedLocation | null>(
		address?.location?.latitude && address?.location?.longitude
			? { latitude: address.location.latitude, longitude: address.location.longitude }
			: null,
	);
	const [mapOpen, setMapOpen] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Re-prime the form whenever the sheet opens with a (possibly new) address.
	useEffect(() => {
		if (!visible) return;
		const parts = splitStreet(address);
		setCity(address?.city || "");
		setStreet(parts.street);
		setBuilding(parts.building);
		setLandmark(parts.landmark);
		setPin(
			address?.location?.latitude && address?.location?.longitude
				? { latitude: address.location.latitude, longitude: address.location.longitude }
				: null,
		);
		setError(null);
	}, [visible, address]);

	const onPinConfirmed = (location: PickedLocation) => {
		setPin(location);
		setMapOpen(false);
		setSyncing(true);
		reverseGeocodePoint(location.latitude, location.longitude)
			.then((addr) => {
				// A locked city never follows the pin — it belongs to the account.
				if (addr?.city && !lockCity) setCity(addr.city);
				if (addr?.street && !street) setStreet(addr.street);
			})
			.finally(() => setSyncing(false));
	};

	const save = async () => {
		if (!pin) return setError(t("addressNeededBody"));
		if (!city.trim()) return setError(t("fieldRequired"));
		setError(null);
		setSaving(true);
		try {
			const composed = [street.trim(), building.trim(), landmark.trim()].filter(Boolean).join(SEP);
			const saved = await saveUserAddress({
				city: city.trim(),
				street: composed,
				state: getStateForCity(city.trim()) || undefined,
				location: pin,
			});
			notifySuccess();
			onSaved?.(saved);
			onClose();
		} catch (err) {
			console.error("Address save failed:", err);
			notifyError();
			setError(t("requestFailed"));
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			{/* The map picker is a full-screen RN Modal, which always renders above
			    the sheet — so the sheet stays presented underneath it. */}
			<AppBottomSheet
				visible={visible}
				onClose={onClose}
				title={t("deliveryAddress")}
				snapPoints={["75%", "95%"]}
				footer={<PrimaryButton label={t("saveAddress")} onPress={save} loading={saving} />}
			>
				<View style={styles.pinRow}>
					<MapPin size={icon.size} strokeWidth={icon.strokeWidth} color={pin ? colors.success : colors.textMuted} />
					<View style={{ flex: 1 }}>
						<Text style={styles.pinText}>{pin ? t("pinSet") : t("pinOnMap")}</Text>
						<Text style={styles.pinSub}>{t("addressNeededBody")}</Text>
					</View>
				</View>
				<PrimaryButton
					label={pin ? t("adjustPinOnMap") : t("setPinOnMap")}
					variant="secondary"
					onPress={() => setMapOpen(true)}
					style={styles.mapButton}
					icon={<MapPinned size={icon.size} strokeWidth={icon.strokeWidth} color={colors.text} />}
				/>
				{syncing && (
					<View style={styles.syncing}>
						<ActivityIndicator size="small" color={colors.primary} />
						<Text style={styles.syncingText}>{t("syncingAddress")}</Text>
					</View>
				)}

				{lockCity ? (
					// View-only at checkout: the city belongs to the account and is
					// changed from the header's location pill, not per order.
					<FormField
						label={t("cityLabel")}
						value={city}
						editable={false}
						right={<Lock size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
						hint={t("cityLockedHint")}
					/>
				) : (
					<FormField label={t("cityLabel")} required value={city} onChangeText={setCity} autoCapitalize="words" />
				)}
				<FormField
					label={t("streetAreaLabel")}
					value={street}
					onChangeText={setStreet}
					placeholder={t("streetAreaPlaceholder")}
					autoCapitalize="words"
				/>
				<FormField
					label={t("buildingFloorLabel")}
					value={building}
					onChangeText={setBuilding}
					placeholder={t("buildingFloorPlaceholder")}
					autoCapitalize="words"
				/>
				<FormField
					label={t("landmarkLabel")}
					value={landmark}
					onChangeText={setLandmark}
					placeholder={t("landmarkPlaceholder")}
					autoCapitalize="sentences"
					error={error}
				/>
			</AppBottomSheet>

			<LocationPickerMap
				visible={mapOpen}
				initialLocation={pin}
				onClose={() => setMapOpen(false)}
				onConfirm={onPinConfirmed}
				title={t("setYourLocation")}
				confirmLabel={t("confirmLocation")}
				useMyLocationLabel={t("useMyLocation")}
			/>
		</>
	);
}

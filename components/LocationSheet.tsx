// Delivery-location selector sheet (replaces the header's city dropdown).
//
// Shows the address the catalog is currently bound to, a one-tap "use my
// current location" (GPS -> reverse geocode -> save), and a searchable list of
// every Lebanese town. Saving goes through utils/userAddress so the profile,
// the local cache and every city-scoped feed update together.
//
// Zone conflict: switching address while the cart holds items from a store
// that doesn't deliver to the new area intercepts the switch with a decision
// step — remove the items and switch, or keep the previous address.
//
// One sheet, always the same props: the conflict step swaps the CONTENT, not
// the AppBottomSheet (re-configuring a live BottomSheetModal — new snap
// points, dynamic sizing — is exactly the kind of thing that makes it close
// itself). Every failure is shown inline; a save that silently fails looks
// like "I can't change my city".
import { Image } from "expo-image";
import { Check, LocateFixed, MapPin, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import AppBottomSheet from "@/components/ui/AppBottomSheet";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { LEBANESE_CITIES } from "@/constants/lebaneseCities";
import { colors, icon } from "@/constants/theme";
import { MAIN_SOURCE, useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { ApiError, MarketService } from "@/services/api";
import { styles } from "@/styles/components/LocationSheet.styles";
import type { LocationSheetProps } from "@/types/components/LocationSheet.types";
import { detectCityFromLocation, getCityCoordinates, getStateForCity } from "@/utils/cityDetection";
import {
	entityVisibleForCityOrPin,
	isServedByAdmin,
} from "@/utils/cityVisibility";
import { notifyError, notifySuccess, notifyWarning, tapSelection } from "@/utils/haptics";
import { interpolate } from "@/utils/i18n";
import { saveUserAddress, type AddressPatch } from "@/utils/userAddress";

type Pending = { patch: AddressPatch; city: string };

// Stable identity: a fresh array each render makes the modal re-lay-out.
const SNAP_POINTS = ["70%", "92%"];

export default function LocationSheet({
	visible,
	onClose,
	currentCity,
	currentStreet,
	onSaved,
}: LocationSheetProps) {
	const { t, td, isRTL } = useTranslation();
	const { cart, cartSource, cartMarket, clearCart } = useCart();
	const [search, setSearch] = useState("");
	const [saving, setSaving] = useState(false);
	const [locating, setLocating] = useState(false);
	// Set when the chosen address isn't served by the cart's store.
	const [conflict, setConflict] = useState<Pending | null>(null);
	// Why the last save failed (server message when there is one).
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!visible) {
			setSearch("");
			setConflict(null);
			setSaving(false);
			setLocating(false);
			setError(null);
		}
	}, [visible]);

	const visibleCities = useMemo(() => {
		const q = search.trim().toLowerCase();
		return q ? LEBANESE_CITIES.filter((c) => c.toLowerCase().includes(q)) : LEBANESE_CITIES;
	}, [search]);

	// Does the store the cart belongs to deliver to this city / pin?
	const cartServes = async (city: string, pin: AddressPatch["location"]): Promise<boolean> => {
		if (!cart.length) return true;
		if (!cartSource || cartSource === MAIN_SOURCE) return isServedByAdmin(city, pin || null);
		let market: unknown = cartMarket && typeof cartMarket === "object" ? cartMarket : null;
		if (!market) {
			try {
				const res = await MarketService.listPublic();
				const list = Array.isArray(res?.data) ? res.data : [];
				market = list.find((m) => String(m._id) === String(cartSource)) || null;
			} catch {
				return true; // can't verify -> don't block the switch
			}
		}
		if (!market) return true;
		return entityVisibleForCityOrPin(market, city, pin || null);
	};

	const commit = async (patch: AddressPatch, city: string) => {
		setSaving(true);
		setError(null);
		try {
			await saveUserAddress(patch);
			notifySuccess();
			onSaved?.(city);
			onClose();
		} catch (err) {
			console.error("Failed to save address:", err);
			notifyError();
			const payload = err instanceof ApiError ? (err.payload as { message?: string } | null) : null;
			setError(payload?.message || (err as Error)?.message || t("addressSaveFailed"));
			// Back to the list so the shopper can retry.
			setConflict(null);
		} finally {
			setSaving(false);
		}
	};

	const choose = async (patch: AddressPatch, city: string) => {
		if (!city || (city === currentCity && patch.location === undefined)) {
			onClose();
			return;
		}
		// Busy for the whole tap — the zone check may fetch the market list, and
		// an un-flagged wait reads as "the tap did nothing".
		setSaving(true);
		setError(null);
		try {
			const pin = patch.location === undefined ? getCityCoordinates(city) : patch.location;
			if (await cartServes(city, pin)) return await commit(patch, city);
			notifyWarning();
			setConflict({ patch, city });
		} finally {
			setSaving(false);
		}
	};

	const handleSelectCity = (city: string) => {
		tapSelection();
		choose({ city, state: getStateForCity(city) || undefined }, city);
	};

	const handleUseGps = async () => {
		setLocating(true);
		try {
			const result = await detectCityFromLocation();
			if (!result?.city) return;
			const location =
				typeof result.latitude === "number" && typeof result.longitude === "number"
					? { latitude: result.latitude, longitude: result.longitude }
					: undefined;
			await choose(
				{
					city: result.city,
					street: result.street || undefined,
					state: getStateForCity(result.city) || result.region || undefined,
					location,
				},
				result.city,
			);
		} finally {
			setLocating(false);
		}
	};

	const conflictStep = conflict ? (
		<>
			<Text style={styles.conflictTitle}>
				{interpolate(t("cartConflictTitle"), { city: conflict.city })}
			</Text>
			<Text style={styles.conflictBody}>{t("cartConflictBody")}</Text>
			{cart.map((item) => (
				<View key={item._id} style={[styles.conflictItem, isRTL && { flexDirection: "row-reverse" }]}>
					<Image source={{ uri: item.picture }} style={styles.conflictThumb} contentFit="contain" />
					<Text style={styles.conflictName} numberOfLines={1}>
						{td(item.name)} × {item.quantity}
					</Text>
				</View>
			))}
			<View style={styles.conflictActions}>
				<PrimaryButton
					label={t("cartConflictRemoveAndSwitch")}
					loading={saving}
					onPress={async () => {
						await clearCart();
						await commit(conflict.patch, conflict.city);
					}}
				/>
				<PrimaryButton
					label={t("cartConflictKeep")}
					variant="secondary"
					onPress={() => setConflict(null)}
				/>
			</View>
		</>
	) : null;

	const pickerStep = (
		<>
			<View style={[styles.currentCard, isRTL && { flexDirection: "row-reverse" }]}>
				<View style={styles.pinCircle}>
					<MapPin size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
				</View>
				<View style={{ flex: 1 }}>
					<Text style={styles.currentLabel}>{t("deliverTo")}</Text>
					<Text style={styles.currentCity} numberOfLines={1}>
						{currentCity || t("selectCity")}
					</Text>
					{currentStreet ? (
						<Text style={styles.currentStreet} numberOfLines={1}>
							{currentStreet}
						</Text>
					) : null}
				</View>
				{saving ? <ActivityIndicator color={colors.primary} /> : null}
			</View>

			<PrimaryButton
				label={locating ? t("locating") : t("useCurrentLocation")}
				variant="secondary"
				loading={locating}
				disabled={saving}
				onPress={handleUseGps}
				style={styles.gpsButton}
				icon={<LocateFixed size={icon.size} strokeWidth={icon.strokeWidth} color={colors.text} />}
			/>

			{error ? (
				<Text style={[styles.error, isRTL && { textAlign: "right" }]}>{error}</Text>
			) : null}

			<View style={[styles.searchBox, isRTL && { flexDirection: "row-reverse" }]}>
				<Search size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
				<TextInput
					style={styles.searchInput}
					placeholder={t("searchCity")}
					placeholderTextColor={colors.textDisabled}
					value={search}
					onChangeText={setSearch}
					autoCorrect={false}
				/>
			</View>

			{visibleCities.length === 0 ? (
				<Text style={styles.empty}>{t("noCityMatch")}</Text>
			) : (
				visibleCities.map((city) => {
					const active = city === currentCity;
					return (
						<Pressable
							key={city}
							onPress={() => handleSelectCity(city)}
							disabled={saving}
							style={({ pressed }) => [
								styles.row,
								isRTL && { flexDirection: "row-reverse" },
								pressed && { backgroundColor: colors.surface },
							]}
						>
							<Text style={[styles.rowText, active && styles.rowTextActive]}>{city}</Text>
							{active ? (
								<Check size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
							) : null}
						</Pressable>
					);
				})
			)}
		</>
	);

	return (
		<AppBottomSheet
			visible={visible}
			onClose={onClose}
			title={conflict ? undefined : t("deliveryLocation")}
			snapPoints={SNAP_POINTS}
			disableBackdropClose={!!conflict}
		>
			{conflict ? conflictStep : pickerStep}
		</AppBottomSheet>
	);
}

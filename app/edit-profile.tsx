import CityPicker from "@/components/CityPicker";
import LoadingButton from "@/components/LoadingButton";
import LocationPickerMap, { type PickedLocation } from "@/components/LocationPickerMap";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import type { User } from "@/types";
import { getCityCoordinates, getStateForCity, reverseGeocodePoint } from "@/utils/cityDetection";
import { rtlText } from "@/utils/rtl";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    DeviceEventEmitter,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ProfileForm {
	name: string;
	phoneNumber: string;
	street: string;
	city: string;
	state: string;
	country: string;
}

export default function EditProfile() {
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();
	const { t, isRTL } = useTranslation();

	const [form, setForm] = useState<ProfileForm>({
		name: "",
		phoneNumber: "+961",
		street: "",
		city: "",
		state: "",
		country: "LB",
	});
	const [pin, setPin] = useState<PickedLocation | null>(null);
	const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
	const [syncingAddress, setSyncingAddress] = useState<boolean>(false);

	console.log("user data in EditProfile:", user);

	useEffect(() => {
		const checkLogin = async (): Promise<void> => {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) {
				router.replace("/start");
			} else {
				try {
					const parsedUser = userData ? JSON.parse(userData) : null;
					const token = parsedUser?.token;

					if (!token) {
						console.error("⚠️ No token found in userData");
						return;
					}

					const res = await AuthService.me();
					const fetchedUser = (res.data as unknown as { user?: User })?.user;

					if (fetchedUser) {
						setUser(fetchedUser);

						setForm({
							name: fetchedUser.name || "",
							phoneNumber: fetchedUser.phoneNumber || "+961",
							street: fetchedUser.address?.street || "",
							city: fetchedUser.address?.city || "",
							state: fetchedUser.address?.state || "",
							country: "LB",
						});
						const loc = fetchedUser.address?.location;
						if (
							loc &&
							typeof loc.latitude === "number" &&
							typeof loc.longitude === "number"
						) {
							setPin({ latitude: loc.latitude, longitude: loc.longitude });
						}
					} else {
						console.error("❌ Failed to fetch user");
					}
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
			}
		};

		checkLogin();
	}, [router]);

	// Listen for city changes made elsewhere (e.g. the nav header's city
	// dropdown) so this form's city/state/pin stay in sync instantly, without
	// needing to leave and reopen this screen.
	useEffect(() => {
		const sub = DeviceEventEmitter.addListener(
			"userCityChanged",
			(payload: string | { city?: string; state?: string; location?: PickedLocation }) => {
				const city = typeof payload === "string" ? payload : payload?.city;
				if (!city) return;
				const state = typeof payload === "string" ? getStateForCity(city) : payload?.state;
				const location =
					typeof payload === "string" ? getCityCoordinates(city) : payload?.location;
				setForm((prev) => ({
					...prev,
					city,
					...(state ? { state } : {}),
				}));
				if (location) setPin(location);
			}
		);
		return () => sub.remove();
	}, []);

	const [updating, setUpdating] = useState<boolean>(false);

	const handleUpdate = async (): Promise<void> => {
		if (updating) return;
		setUpdating(true);
		try {
			if (!form.phoneNumber || !form.phoneNumber.trim() || form.phoneNumber.trim() === "+961") {
				Alert.alert(t("warning"), t("phoneRequired"));
				return;
			}

			const stored = await AsyncStorage.getItem("userData");
			if (!stored) {
				Alert.alert(t("warning"), t("noUserData"));
				return;
			}

			const { token } = JSON.parse(stored);

			const payload = {
				name: form.name,
				phoneNumber: form.phoneNumber,
				address: {
					street: form.street,
					city: form.city,
					state: form.state,
					country: form.country,
					...(pin ? { location: pin } : {}),
				},
			};

			const data = await AuthService.updateProfile(payload);

			if (data?.success) {
				// Re-fetch user data from API to get updated info
				try {
					const userData = await AuthService.me();
					const freshUser = (userData.data as unknown as { user?: User })?.user;
					// Update AsyncStorage with fresh user data (keep the token)
					if (freshUser) {
						// ⚠️ Guard against the backend silently dropping the exact map
						// pin on update. We just successfully sent `address.location`
						// above, so if the freshly re-fetched user doesn't have it (or
						// has an invalid one), the PUT /auth/profile endpoint on the
						// server likely isn't persisting/returning that field yet.
						// Patch it back in locally so the map doesn't visually revert
						// to the Beirut default pin the next time this screen opens
						// within the same session, and log a clear diagnostic so this
						// backend gap is easy to spot/fix server-side.
						const freshLoc = freshUser.address?.location;
						const freshLocValid =
							freshLoc &&
							typeof freshLoc.latitude === "number" &&
							typeof freshLoc.longitude === "number";
						if (pin && !freshLocValid) {
							console.warn(
								"⚠️ address.location missing from /auth/me response after saving a pin — the backend may not be persisting/returning this field. Patching it back in locally so the UI stays consistent this session."
							);
							freshUser.address = { ...freshUser.address, location: pin };
						}

						const updatedUserData = {
							token,
							user: freshUser,
						};
						await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
						setUser(freshUser);
						if (pin && !freshLocValid) setPin(pin);

						// Let the nav header (and any other listeners) know the city
						// may have changed, so it updates instantly without a refresh.
						const newCity = freshUser.address?.city;
						if (newCity) {
							DeviceEventEmitter.emit("userCityChanged", {
								city: newCity,
								state: freshUser.address?.state,
								location: freshUser.address?.location,
							});
						}
					}
				} catch (fetchErr) {
					// Non-fatal: the profile update itself already succeeded above,
					// this re-fetch is only to refresh the locally cached user.
					// Failing here (e.g. a slow/cold-starting server timing out)
					// should never block the success message or crash the app.
					console.warn("Failed to re-fetch user data after update:", fetchErr);
				}

				Alert.alert(t("success"), t("profileUpdated"), [
					{ text: t("ok"), onPress: () => router.back() }
				]);
				return;
			} else {
				Alert.alert(
					t("error"),
					t("updateFailed") + (data?.message || t("unknownError"))
				);
			}
		} catch (err) {
			console.error("🔥 Unexpected error:", err);
			alert(t("somethingWrong"));
		} finally {
			setUpdating(false);
		}
	};

	return (
		<ScrollView style={styles.container}>
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#000000" />
			</TouchableOpacity>

			{(["name", "phoneNumber"] as (keyof ProfileForm)[]).map((key) => (
				<View key={key} style={styles.fieldGroup}>
					<Text style={[styles.label, rtlText(isRTL)]}>
						{key === "phoneNumber" ? t("phoneNumber") : t("fullName")}
					</Text>
					<TextInput
						style={[styles.input, rtlText(isRTL)]}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			{(["street"] as (keyof ProfileForm)[]).map((key) => (
				<View key={key} style={styles.fieldGroup}>
					<Text style={[styles.label, rtlText(isRTL)]}>{t(key)}</Text>
					<TextInput
						style={[styles.input, rtlText(isRTL)]}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			<View style={styles.fieldGroup}>
				<Text style={[styles.label, rtlText(isRTL)]}>{t("city")}</Text>
				{/* Editable — picking a city here snaps the map pin to that city's
				    approximate center (two-way sync with the map pin below). Guarded
				    against a known @react-native-picker/picker quirk where
				    onValueChange can fire again with the *same* value once the
				    "value" prop is updated programmatically (e.g. right after the
				    profile loads) — without the `val !== form.city` check that
				    spurious call would silently overwrite the shopper's real saved
				    pin with just an approximate city-center guess. */}
				<CityPicker
					value={form.city}
					onValueChange={(val: string) => {
						const changed = val !== form.city;
						const state = getStateForCity(val);
						setForm((prev) => ({
							...prev,
							city: val,
							// Auto-derive the Lebanese governorate (state) from the newly
							// picked city so it always stays valid and in sync.
							state: state || prev.state,
						}));
						if (changed) {
							const coords = getCityCoordinates(val);
							if (coords) setPin(coords);
							// Let the nav header (and any other listeners) update instantly
							// — this is optimistic (before Save is pressed), matching how
							// the header's own city dropdown updates the rest of the app.
							DeviceEventEmitter.emit("userCityChanged", { city: val, state, location: coords });
						}
					}}
					placeholder={t("city")}
				/>
			</View>

			{/* ✅ Exact map pin — lets the shopper drop/adjust their delivery pin so
			    drivers can be matched by exact coverage, not just city name. */}
			<TouchableOpacity
				onPress={() => setShowMapPicker(true)}
				style={styles.mapPinButton}
			>
				<Feather name="map" size={16} color={pin ? "#22a45d" : "#f4bb26"} />
				<Text
					style={styles.mapPinButtonText}
				>
					{pin ? t("adjustPinOnMap") : t("setPinOnMap")}
				</Text>
			</TouchableOpacity>

			<LocationPickerMap
				visible={showMapPicker}
				initialLocation={pin}
				onClose={() => setShowMapPicker(false)}
				onConfirm={(location) => {
					setPin(location);
					setShowMapPicker(false);
					// Keep city/street/state in sync with the exact point the shopper
					// just dropped the pin on — reverse-geocode it and overwrite the
					// address fields so they can never disagree with the map pin.
					setSyncingAddress(true);
					reverseGeocodePoint(location.latitude, location.longitude)
						.then((addr) => {
							setForm((prev) => {
								const nextCity = addr?.city || prev.city;
								// Always derive the Lebanese governorate from the resolved
								// city rather than trusting the raw geocoded region text.
								const nextState = getStateForCity(nextCity) || prev.state;
								// Let the nav header (and any other listeners) update
								// instantly — optimistic, before Save is pressed.
								if (nextCity !== prev.city || nextState !== prev.state) {
									DeviceEventEmitter.emit("userCityChanged", {
										city: nextCity,
										state: nextState,
										location,
									});
								}
								return {
									...prev,
									city: nextCity,
									street: addr?.street || prev.street,
									state: nextState,
								};
							});
						})
						.finally(() => setSyncingAddress(false));
				}}
				title={t("setYourLocation")}
				confirmLabel={t("confirmLocation")}
				useMyLocationLabel={t("useMyLocation")}
			/>

			{syncingAddress && (
				<View
					style={styles.syncingContainer}
				>
					<ActivityIndicator size="small" color="#f4bb26" />
					<Text
						style={styles.syncingText}
					>
						{t("syncingAddress")}
					</Text>
				</View>
			)}

			<View style={styles.fieldGroup}>
				<Text style={[styles.label, rtlText(isRTL)]}>{t("state")}</Text>
				{/* Read-only — derived only from the map pin, never typed. */}
				<TextInput
					style={[styles.input, styles.inputDisabled, rtlText(isRTL)]}
					value={form.state}
					editable={false}
				/>
			</View>

			<View style={styles.fieldGroup}>
				<Text style={[styles.label, rtlText(isRTL)]}>{t("country")}</Text>
				<TextInput style={[styles.input, rtlText(isRTL)]} value={t("lebanon")} editable={false} />
			</View>

			<LoadingButton style={styles.saveBtn} onPress={handleUpdate} loadingColor="#000">
				<Text style={styles.saveText}>{t("saveChanges")}</Text>
			</LoadingButton>

			<View style={styles.bottomSpacer} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 20, backgroundColor: "#fff" },
	fieldGroup: { marginBottom: 12 },
	bottomSpacer: { height: 220 },
	label: { marginBottom: 4, color: "#555" },
	input: { borderWidth: 1, padding: 12, borderRadius: 15, borderColor: "#ccc" },
	inputDisabled: { backgroundColor: "#f2f2f2", borderColor: "#ddd", color: "#666" },
	mapPinButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		alignSelf: "stretch",
		marginBottom: 16,
		paddingVertical: 4,
	},
	mapPinButtonText: {
		color: "#555",
		fontSize: 13,
		lineHeight: 18,
		textDecorationLine: "underline",
		flex: 1,
		flexWrap: "wrap",
	},
	syncingContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 10,
		backgroundColor: "#fff8e6",
	},
	syncingText: { color: "#7a6a2e", fontSize: 13, fontWeight: "600", lineHeight: 18, flex: 1, flexWrap: "wrap" },
	saveBtn: {
		backgroundColor: "#f4bb26",
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	saveText: { textAlign: "center", fontWeight: "600" },
	backButton: { marginBottom: 20 },
});

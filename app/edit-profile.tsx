import CityPicker from "@/components/CityPicker";
import LocationPickerMap, { type PickedLocation } from "@/components/LocationPickerMap";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import type { User } from "@/types";
import { getCityCoordinates, reverseGeocodePoint } from "@/utils/cityDetection";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
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
	const { t } = useTranslation();

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

	const handleUpdate = async (): Promise<void> => {
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
						const updatedUserData = {
							token,
							user: freshUser,
						};
						await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
						setUser(freshUser);
					}
				} catch (fetchErr) {
					console.error("⚠️ Failed to re-fetch user data:", fetchErr);
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
		}
	};

	return (
		<ScrollView style={styles.container}>
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#000000" />
			</TouchableOpacity>

			{(["name", "phoneNumber"] as (keyof ProfileForm)[]).map((key) => (
				<View key={key} style={styles.fieldGroup}>
					<Text style={styles.label}>
						{key === "phoneNumber" ? t("phoneNumber") : t("fullName")}
					</Text>
					<TextInput
						style={styles.input}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			{(["street"] as (keyof ProfileForm)[]).map((key) => (
				<View key={key} style={styles.fieldGroup}>
					<Text style={styles.label}>{t(key)}</Text>
					<TextInput
						style={styles.input}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			<View style={styles.fieldGroup}>
				<Text style={styles.label}>{t("city")}</Text>
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
						setForm((prev) => ({ ...prev, city: val }));
						if (changed) {
							const coords = getCityCoordinates(val);
							if (coords) setPin(coords);
						}
					}}
					placeholder={t("city")}
				/>
			</View>

			{/* ✅ Exact map pin — lets the shopper drop/adjust their delivery pin so
			    drivers can be matched by exact coverage, not just city name. */}
			<TouchableOpacity
				onPress={() => setShowMapPicker(true)}
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: 6,
					alignSelf: "stretch",
					marginBottom: 16,
					paddingVertical: 4,
				}}
			>
				<Feather name="map" size={16} color={pin ? "#22a45d" : "#f4bb26"} />
				<Text
					style={{
						color: "#555",
						fontSize: 13,
						lineHeight: 18,
						textDecorationLine: "underline",
						flex: 1,
						flexWrap: "wrap",
					}}
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
							setForm((prev) => ({
								...prev,
								city: addr?.city || prev.city,
								street: addr?.street || prev.street,
								state: addr?.region || prev.state,
							}));
						})
						.finally(() => setSyncingAddress(false));
				}}
				title={t("setYourLocation")}
				confirmLabel={t("confirmLocation")}
				useMyLocationLabel={t("useMyLocation")}
			/>

			{syncingAddress && (
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 8,
						marginBottom: 12,
						paddingVertical: 8,
						paddingHorizontal: 12,
						borderRadius: 10,
						backgroundColor: "#fff8e6",
					}}
				>
					<ActivityIndicator size="small" color="#f4bb26" />
					<Text
						style={{
							color: "#7a6a2e",
							fontSize: 13,
							fontWeight: "600",
							lineHeight: 18,
							flex: 1,
							flexWrap: "wrap",
						}}
					>
						{t("syncingAddress")}
					</Text>
				</View>
			)}

			<View style={styles.fieldGroup}>
				<Text style={styles.label}>{t("state")}</Text>
				{/* Read-only — derived only from the map pin, never typed. */}
				<TextInput
					style={[styles.input, styles.inputDisabled]}
					value={form.state}
					editable={false}
				/>
			</View>

			<View style={styles.fieldGroup}>
				<Text style={styles.label}>{t("country")}</Text>
				<TextInput style={styles.input} value={t("lebanon")} editable={false} />
			</View>

			<TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
				<Text style={styles.saveText}>{t("saveChanges")}</Text>
			</TouchableOpacity>

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
	saveBtn: {
		backgroundColor: "#f4bb26",
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	saveText: { textAlign: "center", fontWeight: "600" },
	backButton: { marginBottom: 20 },
});

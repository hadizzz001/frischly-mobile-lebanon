import CityPicker from "@/components/CityPicker";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import type { User } from "@/types";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
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
				<CityPicker
					value={form.city}
					onValueChange={(val: string) => setForm({ ...form, city: val })}
					placeholder={t("city")}
				/>
			</View>

			{(["state"] as (keyof ProfileForm)[]).map((key) => (
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
	saveBtn: {
		backgroundColor: "#f4bb26",
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	saveText: { textAlign: "center", fontWeight: "600" },
	backButton: { marginBottom: 20 },
});

import CityPicker from "@/components/CityPicker";
import { useTranslation } from "@/contexts/TranslationContext";
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

export default function EditProfile() {
	const [user, setUser] = useState(null);
	const router = useRouter();
	const { t } = useTranslation();

	const [form, setForm] = useState({
		name: "",
		phoneNumber: "+961",
		street: "",
		city: "",
		state: "",
		country: "LB",
	});

	console.log("user data in EditProfile:", user);

	useEffect(() => {
		const checkLogin = async () => {
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

					const res = await fetch(
						"https://frischly-dash-leb.onrender.com/api/auth/me",
						{
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						}
					);

					if (res.ok) {
						const data = await res.json();
						setUser(data.data.user);

						setForm({
							name: data.data.user.name || "",
							phoneNumber: data.data.user.phoneNumber || "+961",
							street: data.data.user.address?.street || "",
							city: data.data.user.address?.city || "",
							state: data.data.user.address?.state || "",
							country: "LB",
						});
					} else {
						console.error("❌ Failed to fetch user:", res.status);
					}
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
			}
		};

		checkLogin();
	}, [router]);

	const handleUpdate = async () => {
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

			const res = await fetch(
				"https://frischly-dash-leb.onrender.com/api/auth/profile",
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(payload),
				}
			);

			const data = await res.json().catch(() => ({}));

			if (res.ok && data.success) {
				// Re-fetch user data from API to get updated info
				try {
					const userRes = await fetch(
						"https://frischly-dash-leb.onrender.com/api/auth/me",
						{
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						}
					);

					if (userRes.ok) {
						const userData = await userRes.json();
						// Update AsyncStorage with fresh user data (keep the token)
						if (userData?.data?.user) {
							const updatedUserData = {
								token,
								user: userData.data.user,
							};
							await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
							setUser(userData.data.user);
						}
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
					t("updateFailed") + (data.message || t("unknownError"))
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

			{["name", "phoneNumber"].map((key) => (
				<View key={key} style={{ marginBottom: 12 }}>
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

			{["street"].map((key) => (
				<View key={key} style={{ marginBottom: 12 }}>
					<Text style={styles.label}>{t(key)}</Text>
					<TextInput
						style={styles.input}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			<View style={{ marginBottom: 12 }}>
				<Text style={styles.label}>{t("city")}</Text>
				<CityPicker
					value={form.city}
					onValueChange={(val) => setForm({ ...form, city: val })}
					placeholder={t("city")}
				/>
			</View>

			{["state"].map((key) => (
				<View key={key} style={{ marginBottom: 12 }}>
					<Text style={styles.label}>{t(key)}</Text>
					<TextInput
						style={styles.input}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			<View style={{ marginBottom: 12 }}>
				<Text style={styles.label}>{t("country")}</Text>
				<TextInput style={styles.input} value={t("lebanon")} editable={false} />
			</View>

			<TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
				<Text style={styles.saveText}>{t("saveChanges")}</Text>
			</TouchableOpacity>

			<View style={{ height: 220 }} />
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: { padding: 20, backgroundColor: "#fff" },
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

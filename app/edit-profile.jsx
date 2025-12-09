import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
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

const countryMap = {
	Afghanistan: "AF",
	Albania: "AL",
	Algeria: "DZ",
	Andorra: "AD",
	Angola: "AO",
	Argentina: "AR",
	Armenia: "AM",
	Australia: "AU",
	Austria: "AT",
	Azerbaijan: "AZ",
	Bahamas: "BS",
	Bahrain: "BH",
	Bangladesh: "BD",
	Barbados: "BB",
	Belarus: "BY",
	Belgium: "BE",
	Belize: "BZ",
	Benin: "BJ",
	Bhutan: "BT",
	Bolivia: "BO",
	BosniaAndHerzegovina: "BA",
	Botswana: "BW",
	Brazil: "BR",
	Brunei: "BN",
	Bulgaria: "BG",
	BurkinaFaso: "BF",
	Burundi: "BI",
	Cambodia: "KH",
	Cameroon: "CM",
	Canada: "CA",
	CapeVerde: "CV",
	CentralAfricanRepublic: "CF",
	Chad: "TD",
	Chile: "CL",
	China: "CN",
	Colombia: "CO",
	Comoros: "KM",
	Congo: "CG",
	CongoDR: "CD",
	CostaRica: "CR",
	Croatia: "HR",
	Cuba: "CU",
	Cyprus: "CY",
	CzechRepublic: "CZ",
	Denmark: "DK",
	Djibouti: "DJ",
	Dominica: "DM",
	DominicanRepublic: "DO",
	Ecuador: "EC",
	Egypt: "EG",
	ElSalvador: "SV",
	Estonia: "EE",
	Eswatini: "SZ",
	Ethiopia: "ET",
	Fiji: "FJ",
	Finland: "FI",
	France: "FR",
	Gabon: "GA",
	Gambia: "GM",
	Georgia: "GE",
	Germany: "DE",
	Ghana: "GH",
	Greece: "GR",
	Grenada: "GD",
	Guatemala: "GT",
	Guinea: "GN",
	GuineaBissau: "GW",
	Guyana: "GY",
	Haiti: "HT",
	Honduras: "HN",
	Hungary: "HU",
	Iceland: "IS",
	India: "IN",
	Indonesia: "ID",
	Iran: "IR",
	Iraq: "IQ",
	Ireland: "IE",
	Israel: "IL",
	Italy: "IT",
	IvoryCoast: "CI",
	Jamaica: "JM",
	Japan: "JP",
	Jordan: "JO",
	Kazakhstan: "KZ",
	Kenya: "KE",
	Kuwait: "KW",
	Kyrgyzstan: "KG",
	Laos: "LA",
	Latvia: "LV",
	Lebanon: "LB",
	Lesotho: "LS",
	Liberia: "LR",
	Libya: "LY",
	Liechtenstein: "LI",
	Lithuania: "LT",
	Luxembourg: "LU",
	Madagascar: "MG",
	Malawi: "MW",
	Malaysia: "MY",
	Maldives: "MV",
	Mali: "ML",
	Malta: "MT",
	Mauritania: "MR",
	Mauritius: "MU",
	Mexico: "MX",
	Moldova: "MD",
	Monaco: "MC",
	Mongolia: "MN",
	Montenegro: "ME",
	Morocco: "MA",
	Mozambique: "MZ",
	Myanmar: "MM",
	Namibia: "NA",
	Nepal: "NP",
	Netherlands: "NL",
	NewZealand: "NZ",
	Nicaragua: "NI",
	Niger: "NE",
	Nigeria: "NG",
	NorthKorea: "KP",
	NorthMacedonia: "MK",
	Norway: "NO",
	Oman: "OM",
	Pakistan: "PK",
	Palestine: "PS",
	Panama: "PA",
	PapuaNewGuinea: "PG",
	Paraguay: "PY",
	Peru: "PE",
	Philippines: "PH",
	Poland: "PL",
	Portugal: "PT",
	Qatar: "QA",
	Romania: "RO",
	Russia: "RU",
	Rwanda: "RW",
	SaudiArabia: "SA",
	Senegal: "SN",
	Serbia: "RS",
	Seychelles: "SC",
	SierraLeone: "SL",
	Singapore: "SG",
	Slovakia: "SK",
	Slovenia: "SI",
	Somalia: "SO",
	SouthAfrica: "ZA",
	SouthKorea: "KR",
	SouthSudan: "SS",
	Spain: "ES",
	SriLanka: "LK",
	Sudan: "SD",
	Suriname: "SR",
	Sweden: "SE",
	Switzerland: "CH",
	Syria: "SY",
	Taiwan: "TW",
	Tajikistan: "TJ",
	Tanzania: "TZ",
	Thailand: "TH",
	Togo: "TG",
	TrinidadAndTobago: "TT",
	Tunisia: "TN",
	Turkey: "TR",
	Turkmenistan: "TM",
	Uganda: "UG",
	Ukraine: "UA",
	UnitedArabEmirates: "AE",
	UnitedKingdom: "GB",
	UnitedStates: "US",
	Uruguay: "UY",
	Uzbekistan: "UZ",
	Venezuela: "VE",
	Vietnam: "VN",
	Yemen: "YE",
	Zambia: "ZM",
	Zimbabwe: "ZW",
};

export default function EditProfile() {
	const [user, setUser] = useState(null);
	const router = useRouter();
	const { t } = useTranslation();

	const [zones, setZones] = useState([]); // <-- ZIP zones

	const [form, setForm] = useState({
		name: "",
		phoneNumber: "",
		street: "",
		city: "",
		state: "",
		zipCode: "",
		country: "",
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
						"https://frischlyshop-server.onrender.com/api/auth/me",
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

						const countryName = data.data.user.address?.country || "";
						const shortCode =
							countryMap[countryName.replace(/\s/g, "")] ||
							countryName.slice(0, 2).toUpperCase();

						setForm({
							name: data.data.user.name || "",
							phoneNumber: data.data.user.phoneNumber || "",
							street: data.data.user.address?.street || "",
							city: data.data.user.address?.city || "",
							state: data.data.user.address?.state || "",
							zipCode: data.data.user.address?.zipCode || "",
							country: "DE",
						});
					} else {
						console.error("❌ Failed to fetch user:", res.status);
					}
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
			}
		};

		const fetchZones = async () => {
			try {
				const res = await fetch(
					"https://frischlyshop-server.onrender.com/api/zones"
				);
				const data = await res.json();
				if (res.ok) setZones(data.data || []);
			} catch (err) {
				console.error("⚠️ Failed to fetch zones:", err);
			}
		};

		checkLogin();
		fetchZones();
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
					zipCode: form.zipCode,
					country: form.country, // ✅ still included but read-only
				},
			};

			const res = await fetch(
				"https://frischlyshop-server.onrender.com/api/auth/profile",
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
				Alert.alert(t("success"), t("profileUpdated"));
				router.back();
			} else {
				Alert.alert(
					t("error"),
					t("updateFailed") + (data.message || t("unknownError"))
				);
			}
		} catch (err) {
			console.error("🔥 Unexpected error:", err);
			alert("⚠️ Something went wrong! Check console logs.");
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

			{["street", "city", "state"].map((key) => (
				<View key={key} style={{ marginBottom: 12 }}>
					<Text style={styles.label}>{t(key)}</Text>
					<TextInput
						style={styles.input}
						value={form[key]}
						onChangeText={(val) => setForm({ ...form, [key]: val })}
					/>
				</View>
			))}

			{/* ZIP Code Dropdown */}
			<View
				style={{
					marginBottom: 12,
					width: "100%",
					minHeight: 55,
					justifyContent: "center",
				}}
			>
				<Text style={[styles.label, { marginLeft: 10 }]}>
					{t("selectZipCode")}
				</Text>
				<Picker
					selectedValue={form.zipCode}
					onValueChange={(itemValue) =>
						setForm({ ...form, zipCode: itemValue })
					}
					style={{ color: "#000" }}
				>
					<Picker.Item label="Select Zip Code" value="" />
					{zones.map((zone) => (
						<Picker.Item
							key={zone._id}
							label={`${zone.zipCode} `}
							value={zone.zipCode}
						/>
					))}
				</Picker>
			</View>

			<View style={{ marginBottom: 12 }}>
				<Text style={styles.label}>{t("country")}</Text>
				<TextInput style={styles.input} value={t("germany")} editable={false} />
			</View>

			<TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
				<Text style={styles.saveText}>Save Changes</Text>
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
		backgroundColor: "#FFC300",
		padding: 16,
		borderRadius: 12,
		marginTop: 16,
	},
	saveText: { textAlign: "center", fontWeight: "600" },
	backButton: { marginBottom: 20 },
});

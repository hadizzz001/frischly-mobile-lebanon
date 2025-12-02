"use client";

import { useTranslation } from "@/contexts/TranslationContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Dimensions,
	Image,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

// Add this at the top with your countryMap
const countryPhoneCodes = [
	{ name: "Afghanistan", code: "AF", dial_code: "+93" },
	{ name: "Albania", code: "AL", dial_code: "+355" },
	{ name: "Algeria", code: "DZ", dial_code: "+213" },
	{ name: "Andorra", code: "AD", dial_code: "+376" },
	{ name: "Angola", code: "AO", dial_code: "+244" },
	{ name: "Argentina", code: "AR", dial_code: "+54" },
	{ name: "Armenia", code: "AM", dial_code: "+374" },
	{ name: "Australia", code: "AU", dial_code: "+61" },
	{ name: "Austria", code: "AT", dial_code: "+43" },
	{ name: "Azerbaijan", code: "AZ", dial_code: "+994" },
	{ name: "Bahamas", code: "BS", dial_code: "+1242" },
	{ name: "Bahrain", code: "BH", dial_code: "+973" },
	{ name: "Bangladesh", code: "BD", dial_code: "+880" },
	{ name: "Barbados", code: "BB", dial_code: "+1246" },
	{ name: "Belarus", code: "BY", dial_code: "+375" },
	{ name: "Belgium", code: "BE", dial_code: "+32" },
	{ name: "Belize", code: "BZ", dial_code: "+501" },
	{ name: "Benin", code: "BJ", dial_code: "+229" },
	{ name: "Bhutan", code: "BT", dial_code: "+975" },
	{ name: "Bolivia", code: "BO", dial_code: "+591" },
	{ name: "Bosnia and Herzegovina", code: "BA", dial_code: "+387" },
	{ name: "Botswana", code: "BW", dial_code: "+267" },
	{ name: "Brazil", code: "BR", dial_code: "+55" },
	{ name: "Brunei", code: "BN", dial_code: "+673" },
	{ name: "Bulgaria", code: "BG", dial_code: "+359" },
	{ name: "Burkina Faso", code: "BF", dial_code: "+226" },
	{ name: "Burundi", code: "BI", dial_code: "+257" },
	{ name: "Cambodia", code: "KH", dial_code: "+855" },
	{ name: "Cameroon", code: "CM", dial_code: "+237" },
	{ name: "Canada", code: "CA", dial_code: "+1" },
	{ name: "Cape Verde", code: "CV", dial_code: "+238" },
	{ name: "Central African Republic", code: "CF", dial_code: "+236" },
	{ name: "Chad", code: "TD", dial_code: "+235" },
	{ name: "Chile", code: "CL", dial_code: "+56" },
	{ name: "China", code: "CN", dial_code: "+86" },
	{ name: "Colombia", code: "CO", dial_code: "+57" },
	{ name: "Comoros", code: "KM", dial_code: "+269" },
	{ name: "Congo", code: "CG", dial_code: "+242" },
	{ name: "Congo DR", code: "CD", dial_code: "+243" },
	{ name: "Costa Rica", code: "CR", dial_code: "+506" },
	{ name: "Croatia", code: "HR", dial_code: "+385" },
	{ name: "Cuba", code: "CU", dial_code: "+53" },
	{ name: "Cyprus", code: "CY", dial_code: "+357" },
	{ name: "Czech Republic", code: "CZ", dial_code: "+420" },
	{ name: "Denmark", code: "DK", dial_code: "+45" },
	{ name: "Djibouti", code: "DJ", dial_code: "+253" },
	{ name: "Dominica", code: "DM", dial_code: "+1767" },
	{ name: "Dominican Republic", code: "DO", dial_code: "+1809" },
	{ name: "Ecuador", code: "EC", dial_code: "+593" },
	{ name: "Egypt", code: "EG", dial_code: "+20" },
	{ name: "El Salvador", code: "SV", dial_code: "+503" },
	{ name: "Estonia", code: "EE", dial_code: "+372" },
	{ name: "Eswatini", code: "SZ", dial_code: "+268" },
	{ name: "Ethiopia", code: "ET", dial_code: "+251" },
	{ name: "Fiji", code: "FJ", dial_code: "+679" },
	{ name: "Finland", code: "FI", dial_code: "+358" },
	{ name: "France", code: "FR", dial_code: "+33" },
	{ name: "Gabon", code: "GA", dial_code: "+241" },
	{ name: "Gambia", code: "GM", dial_code: "+220" },
	{ name: "Georgia", code: "GE", dial_code: "+995" },
	{ name: "Germany", code: "DE", dial_code: "+49" },
	{ name: "Ghana", code: "GH", dial_code: "+233" },
	{ name: "Greece", code: "GR", dial_code: "+30" },
	{ name: "Grenada", code: "GD", dial_code: "+1473" },
	{ name: "Guatemala", code: "GT", dial_code: "+502" },
	{ name: "Guinea", code: "GN", dial_code: "+224" },
	{ name: "Guinea-Bissau", code: "GW", dial_code: "+245" },
	{ name: "Guyana", code: "GY", dial_code: "+592" },
	{ name: "Haiti", code: "HT", dial_code: "+509" },
	{ name: "Honduras", code: "HN", dial_code: "+504" },
	{ name: "Hungary", code: "HU", dial_code: "+36" },
	{ name: "Iceland", code: "IS", dial_code: "+354" },
	{ name: "India", code: "IN", dial_code: "+91" },
	{ name: "Indonesia", code: "ID", dial_code: "+62" },
	{ name: "Iran", code: "IR", dial_code: "+98" },
	{ name: "Iraq", code: "IQ", dial_code: "+964" },
	{ name: "Ireland", code: "IE", dial_code: "+353" },
	{ name: "Israel", code: "IL", dial_code: "+972" },
	{ name: "Italy", code: "IT", dial_code: "+39" },
	{ name: "Ivory Coast", code: "CI", dial_code: "+225" },
	{ name: "Jamaica", code: "JM", dial_code: "+1876" },
	{ name: "Japan", code: "JP", dial_code: "+81" },
	{ name: "Jordan", code: "JO", dial_code: "+962" },
	{ name: "Kazakhstan", code: "KZ", dial_code: "+7" },
	{ name: "Kenya", code: "KE", dial_code: "+254" },
	{ name: "Kuwait", code: "KW", dial_code: "+965" },
	{ name: "Kyrgyzstan", code: "KG", dial_code: "+996" },
	{ name: "Laos", code: "LA", dial_code: "+856" },
	{ name: "Latvia", code: "LV", dial_code: "+371" },
	{ name: "Lebanon", code: "LB", dial_code: "+961" },
	{ name: "Syria", code: "SY", dial_code: "+963" },
];

const InputBox = ({
	placeholder,
	value,
	onChangeText,
	secureTextEntry,
	keyboardType,
	inputBg,
	inputText,
	placeholderColor,
}) => (
	<View
		style={{
			marginBottom: 12,
			width: "100%",
			minHeight: 55,
			borderWidth: 1,
			borderColor: "#d1d5db",
			borderRadius: 12,
			backgroundColor: inputBg,
			justifyContent: "center",
		}}
	>
		<TextInput
			placeholder={placeholder}
			value={value}
			onChangeText={onChangeText}
			secureTextEntry={secureTextEntry}
			keyboardType={keyboardType}
			style={{ padding: 15, color: inputText }}
			placeholderTextColor={placeholderColor}
		/>
	</View>
);

export default function Register() {
	const { t, language, switchLanguage } = useTranslation();
	const router = useRouter();
	const screenHeight = Dimensions.get("window").height;
	const [zones, setZones] = useState([]);
	const [zipCode, setZipCode] = useState("");
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// -------------------------
	// States
	// -------------------------
	const [name, setName] = useState("");
	const [countryCode, setCountryCode] = useState("+49");
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [street, setStreet] = useState("");
	const [city, setCity] = useState("");
	const [stateVal, setStateVal] = useState("");
	const [country, setCountry] = useState("");
	const [countryData, setCountryData] = useState(null);
	const languages = [
		{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
		{ code: "de", name: "Deutsch", flag: "https://flagcdn.com/w40/de.png" },
	];

	const selectedLang = languages.find((l) => l.code === language);
	// -------------------------
	// Fetch country and check login
	// -------------------------
	useEffect(() => {
		checkLogin();
	}, []);

	useEffect(() => {
		const fetchZones = async () => {
			try {
				const res = await axios.get(
					"https://frischlyshop-server.onrender.com/api/zones?isActive=true"
				);
				if (res.data.success) {
					setZones(res.data.data); // store the array of zones
				}
			} catch (error) {
				console.log("Error fetching zones:", error.message);
			}
		};
		fetchZones();
	}, []);

	const checkLogin = async () => {
		const userData = await AsyncStorage.getItem("userData");
		if (userData) router.replace("/tabs");
	};

	// -------------------------
	// Register handler
	// -------------------------
	const handleRegister = async () => {
		console.log("Register function called");

		if (!name || !phone || !password || !zipCode) {
			Alert.alert(t("errorTitle"), t("registerMissingFields"));
			return;
		}

		const sanitizedPhone = phone.replace(/\D/g, "");

		const userData = {
			name,
			phoneNumber: sanitizedPhone,
			email: email.toLowerCase(),
			password,
			address: { street, city, state: stateVal, zipCode, country: "DE" },
		};

		try {
			const res = await axios.post(
				"https://frischlyshop-server.onrender.com/api/auth/register",
				userData,
				{ headers: { "Content-Type": "application/json" } }
			);

			if (res.data) {
				await AsyncStorage.setItem("userData", JSON.stringify(res.data.data));

				Alert.alert(t("confirmEmailTitle"), t("confirmEmailBody"), [
					{
						text: "OK",
						onPress: () => {
							// redirect to login page
							router.replace("/start");
						},
					},
				]);
			}
		} catch (error) {
			console.log("Registration caught error:", error);
			Alert.alert(
				t("errorTitle"),
				error.response?.data?.message?.includes("Validation failed")
					? t("registerValidationFailed")
					: error.response?.data?.message || t("registerFailed")
			);
		}
	};

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: "#FFFFFF" }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ paddingBottom: 50 }}
			>
				{/* Top Yellow Section */}
				<View
					style={{
						height: screenHeight * 0.4,
						justifyContent: "center",
						alignItems: "center",
						backgroundColor: "#ffc300",
						borderBottomLeftRadius: 60,
						borderBottomRightRadius: 60,
						overflow: "hidden",
					}}
				>
					<Image
						source={{
							uri: "https://res.cloudinary.com/dtzuor7no/image/upload/v1762515371/LOGO_frischly2_page-0002-removebg-preview_achbk6.png",
						}}
						style={{ width: 200, height: 200 }}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.dropdownContainer}>
					<TouchableOpacity
						style={styles.dropdownButton}
						onPress={() => setDropdownOpen(!dropdownOpen)}
					>
						<Image source={{ uri: selectedLang.flag }} style={styles.flag} />
						<Text style={styles.arrow}>{dropdownOpen ? "▲" : "▼"}</Text>
					</TouchableOpacity>

					{dropdownOpen && (
						<View style={styles.dropdownList}>
							{languages.map((lang) => (
								<TouchableOpacity
									key={lang.code}
									style={styles.dropdownItem}
									onPress={() => {
										switchLanguage(lang.code);
										setDropdownOpen(false);
									}}
								>
									<Image source={{ uri: lang.flag }} style={styles.flag} />
									<Text style={styles.dropdownText}>{lang.name}</Text>
								</TouchableOpacity>
							))}
						</View>
					)}
				</View>

				{/* Bottom Inputs */}
				<View style={{ paddingHorizontal: 24, marginTop: 20 }}>
					<InputBox
						placeholder={t("fullName")}
						value={name}
						onChangeText={setName}
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>

					{/* Phone input */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 12,
							width: "100%",
							borderWidth: 1,
							borderColor: "#000000",
							borderRadius: 12,
							backgroundColor: inputBg,
							minHeight: 55,
							paddingHorizontal: 10,
						}}
					>
						<View style={{ width: 100, justifyContent: "center" }}>
							<Text
								style={{
									position: "absolute",
									left: 10,
									color: inputText,
									fontSize: 16,
								}}
							>
								{countryCode}
							</Text>
							<Picker
								selectedValue={countryCode}
								onValueChange={(itemValue) => setCountryCode(itemValue)}
								style={{ opacity: 0 }}
							>
								{countryPhoneCodes.map((country) => (
									<Picker.Item
										key={country.code}
										label={`${country.name} (${country.dial_code})`}
										value={country.dial_code}
									/>
								))}
							</Picker>
						</View>
						<TextInput
							placeholder={t("phoneNumber")}
							keyboardType="phone-pad"
							value={phone}
							onChangeText={setPhone}
							style={{ flex: 1, paddingVertical: 15, color: inputText }}
							placeholderTextColor={placeholderColor}
						/>
					</View>

					<InputBox
						placeholder={t("email")}
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>

					{/* Password */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 12,
							width: "100%",
							borderWidth: 1,
							borderColor: "#000000",
							borderRadius: 12,
							backgroundColor: inputBg,
						}}
					>
						<TextInput
							placeholder={t("password")}
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={setPassword}
							style={{ flex: 1, padding: 15, color: inputText }}
							placeholderTextColor={placeholderColor}
						/>
						<TouchableOpacity
							onPress={() => setShowPassword(!showPassword)}
							style={{ paddingHorizontal: 10 }}
						>
							<Ionicons
								name={showPassword ? "eye-off" : "eye"}
								size={22}
								color={placeholderColor}
							/>
						</TouchableOpacity>
					</View>

					{/* Address Fields */}
					<InputBox
						placeholder={t("street")}
						value={street}
						onChangeText={setStreet}
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>
					<InputBox
						placeholder={t("city")}
						value={city}
						onChangeText={setCity}
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>
					<InputBox
						placeholder={t("state")}
						value={stateVal}
						onChangeText={setStateVal}
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>
					<View
						style={{
							marginBottom: 12,
							width: "100%",
							minHeight: 55,
							borderWidth: 1,
							borderColor: "#000000",
							borderRadius: 12,
							backgroundColor: inputBg,
							justifyContent: "center",
						}}
					>
						<Picker
							selectedValue={zipCode}
							onValueChange={(itemValue) => setZipCode(itemValue)}
							style={{ color: inputText }}
						>
							<Picker.Item label={t("selectZipCode")} value="" />
							{zones.map((zone) => (
								<Picker.Item
									key={zone._id}
									// display both zipCode and zoneName
									label={`${zone.zipCode}`}
									value={zone.zipCode} // only save zipCode
								/>
							))}
						</Picker>
					</View>

					<InputBox
						value={t("germany")}
						inputBg={inputBg}
						inputText={inputText}
						editable={false}
					/>

					{/* Register Button */}
					<TouchableOpacity
						onPress={handleRegister}
						style={{
							backgroundColor: "#ffc300",
							borderRadius: 15,
							paddingVertical: 15,
							width: "100%",
							alignItems: "center",
							marginBottom: 12,
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
							{t("register")}
						</Text>
					</TouchableOpacity>

					<View
						style={{ alignItems: "center", marginTop: 10, marginBottom: 200 }}
					>
						<TouchableOpacity onPress={() => router.push("/start")}>
							<Text style={{ color: "#000", fontSize: 16 }}>
								{t("alreadyHaveAccount")}{" "}
								<Text style={{ color: "#ffc300" }}>{t("loginHere")}</Text>
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	topNav: {
		height: 80,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		backgroundColor: "#fff",
		zIndex: 100,
		marginTop: 30,
	},
	logo: {
		width: 60,
		height: 60,
	},
	searchBox: {
		flex: 1,
		height: 50,
		marginLeft: 10,
		borderRadius: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		backgroundColor: "#fff",
		paddingHorizontal: 15,
		color: "#000",
	},
	dropdownContainer: {
		marginTop: 30,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		zIndex: 9999,
	},

	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	flag: {
		width: 24,
		height: 16,
		borderRadius: 3,
		marginRight: 6,
	},
	dropdownText: {
		color: "#000",
		fontSize: 14,
	},
	arrow: {
		marginLeft: 5,
		fontSize: 12,
		color: "#333",
	},
	dropdownList: {
		position: "absolute",
		top: 45,
		alignSelf: "center",
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 3,
		width: 150,
		zIndex: 200,
	},

	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 8,
		paddingHorizontal: 10,
	},

	dropdownContainer: {
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
	},
	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	dropdownList: {
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOpacity: 0.1,
		shadowRadius: 5,
		elevation: 3,
		width: 130,
		marginTop: 5,
	},

	dropdownContainer: {
		width: "100%",
		alignItems: "center",
		marginTop: 20,
		zIndex: 9999, // 🔥 FIX: ensures it appears above everything
	},

	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},

	dropdownList: {
		position: "absolute",
		top: 40,
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 10,
		width: 150,
		zIndex: 99999,
	},

	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 12,
	},

	flag: {
		width: 24,
		height: 16,
		marginRight: 8,
		borderRadius: 3,
	},

	dropdownText: {
		color: "#000",
		fontSize: 14,
	},

	arrow: {
		marginLeft: 5,
		fontSize: 14,
		color: "#333",
	},
});

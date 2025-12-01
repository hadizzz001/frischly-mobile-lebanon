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
	View
} from "react-native";

// Add this at the top with your countryMap
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
};



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
		Alert.alert("Error", "Name, phone, zip code and password are required");
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

			Alert.alert(
				"Please confirm your email",
				"We have sent a confirmation email. You must verify your email before logging in.",
				[
					{
						text: "OK",
						onPress: () => {
							// redirect to login page
							router.replace("/start");
						},
					},
				]
			);
		}
	} catch (error) {
		console.log("Registration caught error:", error);
		Alert.alert(
			"Error",
			error.response?.data?.message?.includes("Validation failed")
				? "Check email if correct or password is strong (uppercase, lowercase, numbers and special characters required)"
				: error.response?.data?.message || "Registration failed"
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
						{/* {countryData && (
							<>
								<Image
									source={{ uri: countryData.flag }}
									style={{ width: 24, height: 18 }}
								/>
								<Text style={{ marginHorizontal: 8 }}>{countryData.dial}</Text>
							</>
						)} */}
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
								<Text style={{ color: "#ffc300" }}>
									{t("loginHere")}
								</Text>
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
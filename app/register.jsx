"use client";

import CityPicker from "@/components/CityPicker";
import { useTranslation } from "@/contexts/TranslationContext";
import { formatLocalDate, toCalendarISOString } from "@/utils/date";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
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

const InputBox = ({
	placeholder,
	value,
	onChangeText,
	secureTextEntry,
	keyboardType,
	inputBg,
	inputText,
	placeholderColor,
	...props
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
			{...props}
		/>
	</View>
);

export default function Register() {
	const { t, language, switchLanguage } = useTranslation();
	const router = useRouter();
	const screenHeight = Dimensions.get("window").height;
	const [dropdownOpen, setDropdownOpen] = useState(false);

	// -------------------------
	// States
	// -------------------------
	const [name, setName] = useState("");
	const countryCode = "+961";
	const [phone, setPhone] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [street, setStreet] = useState("");
	const [city, setCity] = useState("");
	const [stateVal, setStateVal] = useState("");
const [dateOfBirth, setDateOfBirth] = useState(null); // Date object
const [showDatePicker, setShowDatePicker] = useState(false);


	const languages = [
		{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
		{ code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },
	];

	const selectedLang = languages.find((l) => l.code === language) || languages[0];
	// -------------------------
	// Fetch country and check login
	// -------------------------
	useEffect(() => {
		checkLogin();
	}, []);

	const checkLogin = async () => {
		const userData = await AsyncStorage.getItem("userData");
		if (userData) router.replace("/tabs");
	};


	const isAdult = (dob) => {
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    return age - 1;
  }
  return age;
};


	// -------------------------
	// Register handler
	// -------------------------
	const handleRegister = async () => {
		console.log("Register function called");

if (!name || !phone || !password || !dateOfBirth) {
  Alert.alert(t("errorTitle"), t("registerMissingFields"));
  return;
}

if (isAdult(dateOfBirth) < 18) {
  Alert.alert(
    t("errorTitle"),
    t("mustBe18") || "You must be at least 18 years old"
  );
  return;
}


const sanitizedPhone = phone.replace(/\D/g, "");

// full international number
const fullPhoneNumber = `${countryCode}${sanitizedPhone}`;

		const userData = {
			name,
			dateOfBirth: toCalendarISOString(dateOfBirth),
			phoneNumber: fullPhoneNumber,
			email: email.toLowerCase(),
			password,
			address: { street, city, state: stateVal, country: "LB" },
		};

		try {
			const res = await axios.post(
				"https://frischly-dash-leb.onrender.com/api/auth/register",
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
						backgroundColor: "#f4bb26",
						borderBottomLeftRadius: 60,
						borderBottomRightRadius: 60,
						overflow: "hidden",
					}}
				>
					<Image
						source={{
							uri: "https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1__1_-removebg-preview_mkv83g.png",
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

{/* Date of Birth */}
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <View pointerEvents="none">
    <InputBox
      placeholder={t("dateOfBirth")}
      value={dateOfBirth ? formatLocalDate(dateOfBirth) : ""}
      inputBg={inputBg}
      inputText={inputText}
      placeholderColor={placeholderColor}
      editable={false}
    />
  </View>
</TouchableOpacity>

{showDatePicker && (
  <DateTimePicker
    value={dateOfBirth || new Date(2000, 0, 1)}
    mode="date"
    display={Platform.OS === "ios" ? "spinner" : "default"}
    maximumDate={new Date()} // 🔒 no future dates
    onChange={(event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) setDateOfBirth(selectedDate);
    }}
  />
)}



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
					<CityPicker
						value={city}
						onValueChange={setCity}
						placeholder={t("city")}
						textColor={inputText}
						style={{
							marginBottom: 12,
							backgroundColor: inputBg,
							minHeight: 55,
						}}
					/>
					<InputBox
						placeholder={t("state")}
						value={stateVal}
						onChangeText={setStateVal}
						inputBg={inputBg}
						inputText={inputText}
						placeholderColor={placeholderColor}
					/>
					<TouchableOpacity
						onPress={() => Alert.alert(t("errorTitle"), t("countryFixed"))}
					>
						<View pointerEvents="none">
							<InputBox
								value={t("lebanon")}
								inputBg={inputBg}
								inputText={inputText}
								editable={false}
							/>
						</View>
					</TouchableOpacity>

					{/* Register Button */}
					<TouchableOpacity
						onPress={handleRegister}
						style={{
							backgroundColor: "#f4bb26",
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
								<Text style={{ color: "#f4bb26" }}>{t("loginHere")}</Text>
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

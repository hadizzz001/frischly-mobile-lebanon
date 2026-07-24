"use client";

import AuthLogoVideo from "@/components/AuthLogoVideo";
import CityPicker from "@/components/CityPicker";
import LocationPickerMap, { type PickedLocation } from "@/components/LocationPickerMap";
import { useTranslation } from "@/contexts/TranslationContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { ApiError, AuthService } from "@/services/api";
import type { AuthPayload } from "@/types";
import { detectCityFromLocation, reverseGeocodePoint } from "@/utils/cityDetection";
import { formatLocalDate, toCalendarISOString } from "@/utils/date";
import { ensureDefaultCity } from "@/utils/userCity";
import { Feather } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    type KeyboardTypeOptions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface InputBoxProps {
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
	secureTextEntry?: boolean;
	keyboardType?: KeyboardTypeOptions;
	inputBg?: string;
	inputText?: string;
	placeholderColor?: string;
	editable?: boolean;
	[key: string]: unknown;
}

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
}: InputBoxProps) => (
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
	const [name, setName] = useState<string>("");
	const countryCode = "+961";
	const [phone, setPhone] = useState<string>("");
	const [email, setEmail] = useState<string>("");
	const [password, setPassword] = useState<string>("");
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const [street, setStreet] = useState<string>("");
	const [city, setCity] = useState<string>("");
	const [stateVal, setStateVal] = useState<string>("");
const [dateOfBirth, setDateOfBirth] = useState<Date | null>(new Date(2000, 0, 1)); // Date object, defaults to 1/1/2000
const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
// ✅ Auto-detected city (via GPS + reverse geocoding) so the shopper usually
// doesn't have to pick it manually. "idle" -> "detecting" -> "done"/"failed".
const [locationStatus, setLocationStatus] = useState<string>("idle");
// ✅ Exact map pin (auto-detected, editable via the map picker below). Sent
// to the backend on registration so drivers can be matched by exact
// delivery-region coverage instead of just city name.
const [pin, setPin] = useState<PickedLocation | null>(null);
const [showMapPicker, setShowMapPicker] = useState<boolean>(false);
const [syncingAddress, setSyncingAddress] = useState<boolean>(false);


	const languages = [
		{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
		{ code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },
	];

	const selectedLang = languages.find((l) => l.code === language) || languages[0];
	// -------------------------
	// Fetch country and check login
	// -------------------------
	const checkLogin = useCallback(async (): Promise<void> => {
		const userData = await AsyncStorage.getItem("userData");
		if (userData) router.replace("/tabs" as never);
	}, [router]);

	useEffect(() => {
		checkLogin();
	}, [checkLogin]);

	// ✅ Auto-detect the shopper's city (GPS -> reverse geocode -> match against
	// our Lebanese city list) as soon as the screen mounts. Entirely silent: on
	// any failure (permission denied, no GPS, no match) we just leave the city
	// picker empty for manual selection — no error shown.
	useEffect(() => {
		runLocationDetection();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const runLocationDetection = async ({ manual = false }: { manual?: boolean } = {}): Promise<void> => {
		setLocationStatus("detecting");
		const result = await detectCityFromLocation();

		if (result?.city) {
			// On the initial silent auto-detect (mount) we only fill in fields that
			// are still empty. When the shopper explicitly taps "use my location",
			// always snap everything — especially the map pin — to the freshly
			// detected, accurate GPS coordinates so it truly reflects where they are.
			setCity((prev) => (manual ? result.city : prev || result.city));
			setStreet((prev) => (manual ? result.street || "" : prev || result.street || ""));
			setStateVal((prev) => (manual ? result.region || "" : prev || result.region || ""));
			if (
				typeof result.latitude === "number" &&
				typeof result.longitude === "number"
			) {
				const accuratePin = { latitude: result.latitude, longitude: result.longitude };
				setPin((prev) => (manual ? accuratePin : prev || accuratePin));
			}
			setLocationStatus("done");
		} else {
			setLocationStatus("failed");
			if (manual) {
				Alert.alert(t("errorTitle"), t("locationNotDetected"));
			}
		}
	};


	const isAdult = (dob: Date): number => {
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
	const handleRegister = async (): Promise<void> => {
		console.log("Register function called");

		// Email is the primary identifier now. Require name, email, phone,
		// password and date of birth.
		if (!name || !email || !phone || !password || !dateOfBirth) {
			Alert.alert(t("errorTitle"), t("registerMissingFields"));
			return;
		}

		const phoneDigits = phone.trim().replace(/^0+/, "");
		if (!/^\d{7,8}$/.test(phoneDigits)) {
			Alert.alert(t("errorTitle"), t("phoneMustBe78Digits"));
			return;
		}

		if (isAdult(dateOfBirth) < 18) {
			Alert.alert(t("errorTitle"), t("mustBe18"));
			return;
		}

		// ✅ The exact map pin is what lets drivers be matched precisely — never
		// let registration proceed without one. If GPS detection hasn't
		// resolved yet (e.g. the shopper filled the form very quickly), give it
		// one last chance here before giving up and asking them to drop the pin
		// manually via the map picker above.
		let finalPin = pin;
		if (!finalPin) {
			setLocationStatus("detecting");
			const result = await detectCityFromLocation();
			if (
				result &&
				typeof result.latitude === "number" &&
				typeof result.longitude === "number"
			) {
				finalPin = { latitude: result.latitude, longitude: result.longitude };
				setPin(finalPin);
				setLocationStatus("done");
			} else {
				setLocationStatus("failed");
			}
		}

		if (!finalPin) {
			Alert.alert(t("errorTitle"), t("pinRequired"));
			return;
		}

		const userData: {
			name: string;
			dateOfBirth: string;
			password: string;
			address: {
				street: string;
				city: string;
				state: string;
				country: string;
				location?: PickedLocation;
			};
			email: string;
			phoneNumber?: string;
		} = {
			name,
			dateOfBirth: toCalendarISOString(dateOfBirth),
			password,
			address: {
				street,
				city,
				state: stateVal,
				country: "LB",
				location: finalPin,
			},
			email: email.trim().toLowerCase(),
			phoneNumber: `${countryCode}${phoneDigits}`,
		};

		try {
			console.log("Register payload:", JSON.stringify(userData));
			const res = await AuthService.register(userData);

			if (res) {
				await AsyncStorage.setItem("userData", JSON.stringify(res.data));

				// Verification link is sent via email.
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
			if (error instanceof ApiError) {
				console.log(
					"Registration caught error:",
					"status:",
					error.status,
					"message:",
					error.message,
					"payload:",
					JSON.stringify(error.payload)
				);
			} else {
				console.log("Registration caught error:", error);
			}
			const message =
				error instanceof ApiError
					? (error.payload as { message?: string } | null)?.message
					: undefined;
			Alert.alert(
				t("errorTitle"),
				message?.includes("Validation failed")
					? t("registerValidationFailed")
					: message || t("registerFailed")
			);
		}
	};

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	// Google sign-up / sign-in
	const [googleLoading, setGoogleLoading] = useState(false);
	const { promptAsync: promptGoogle, isReady: googleReady } = useGoogleAuth(
		async (idToken) => {
			setGoogleLoading(true);
			try {
				const res = await AuthService.googleSignIn(idToken);
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) {
					if (userData.isNewUser === false) {
						// This Google account is already registered — don't silently log
						// them in from the Register screen; send them to Login instead.
						Alert.alert(
							t("accountExistsTitle"),
							t("accountExistsBody"),
							[
								{
									text: "OK",
									onPress: () => router.replace("/start"),
								},
							]
						);
						return;
					}
					await AsyncStorage.setItem("userData", JSON.stringify(await ensureDefaultCity(userData)));
					await AsyncStorage.setItem("guest", "false");
					router.replace("/(tabs)" as never);
				}
			} catch (error) {
				const message =
					error instanceof ApiError
						? (error.payload as { message?: string } | null)?.message
						: undefined;
				Alert.alert(t("errorTitle"), message || t("registerFailed"));
			} finally {
				setGoogleLoading(false);
			}
		},
	);

	const handleGoogle = async () => {
		if (!googleReady) {
			Alert.alert(t("errorTitle"), t("googleNotConfigured"));
			return;
		}
		await promptGoogle();
	};

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
					<AuthLogoVideo style={styles.logoVideo} />
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
							minHeight: 55,
							borderWidth: 1,
							borderColor: "#000000",
							borderRadius: 12,
							backgroundColor: inputBg,
							paddingHorizontal: 12,
						}}
					>
						<Text
							style={{
								color: inputText,
								fontSize: 16,
								fontWeight: "600",
								marginRight: 8,
							}}
						>
							{countryCode}
						</Text>
						<View style={{ width: 1, height: 24, backgroundColor: "#e0e0e0", marginRight: 10 }} />
						<TextInput
							placeholder={t("phoneRequired")}
							keyboardType="phone-pad"
							value={phone}
							onChangeText={(text) => setPhone(text.replace(/[^\d]/g, "").slice(0, 8))}
							maxLength={8}
							style={{ flex: 1, paddingVertical: 15, color: inputText, fontSize: 16 }}
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
						placeholder={t("emailRequiredField")}
						value={email}
						onChangeText={setEmail}
						keyboardType="email-address"
						autoCapitalize="none"
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

					{/* ✅ City — auto-detected via GPS/map pin only; read-only so it can
					    never disagree with the exact delivery pin the shopper set. */}
					<CityPicker
						value={city}
						onValueChange={setCity}
						placeholder={t("city")}
						textColor={inputText}
						disabled
						style={{
							marginBottom: 6,
							backgroundColor: "#f2f2f2",
							minHeight: 55,
						}}
					/>
					<TouchableOpacity
						onPress={() => runLocationDetection({ manual: true })}
						disabled={locationStatus === "detecting"}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 8,
							alignSelf: "stretch",
							marginBottom: 14,
							paddingVertical: 10,
							paddingHorizontal: 12,
							borderRadius: 10,
							backgroundColor: locationStatus === "done" ? "#eafaf0" : "#fff8e6",
						}}
					>
						{locationStatus === "detecting" ? (
							<ActivityIndicator size="small" color="#f4bb26" />
						) : (
							<Feather
								name={locationStatus === "done" ? "check-circle" : "map-pin"}
								size={18}
								color={locationStatus === "done" ? "#22a45d" : "#f4bb26"}
							/>
						)}
						<Text
							style={{
								color: locationStatus === "done" ? "#22a45d" : "#7a6a2e",
								fontSize: 14,
								fontWeight: "600",
								lineHeight: 19,
								flex: 1,
								flexWrap: "wrap",
							}}
						>
							{locationStatus === "detecting"
								? t("detectingLocation")
								: locationStatus === "done"
								? t("locationDetected")
								: t("useMyLocation")}
						</Text>
					</TouchableOpacity>

					{/* ✅ Exact map pin — auto-filled from GPS above, but always
					    adjustable so the shopper can drop the pin exactly on their
					    building/entrance for accurate driver matching. */}
					<TouchableOpacity
						onPress={() => setShowMapPicker(true)}
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 8,
							alignSelf: "stretch",
							marginBottom: 14,
							paddingVertical: 10,
							paddingHorizontal: 12,
							borderRadius: 10,
							backgroundColor: pin ? "#eafaf0" : "#f3f4f6",
						}}
					>
						<Feather
							name="map"
							size={18}
							color={pin ? "#22a45d" : "#555555"}
						/>
						<Text
							style={{
								color: pin ? "#22a45d" : "#333333",
								fontSize: 14,
								fontWeight: "600",
								lineHeight: 19,
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
									if (addr?.city) setCity(addr.city);
									if (addr?.street) setStreet(addr.street);
									if (addr?.region) setStateVal(addr.region);
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
								marginBottom: 10,
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

					{/* ✅ State — same read-only rule as city: derived only from the
					    detected location / map pin, never typed manually. */}
					<InputBox
						placeholder={t("state")}
						value={stateVal}
						inputBg="#f2f2f2"
						inputText={inputText}
						placeholderColor={placeholderColor}
						editable={false}
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
						style={styles.registerButton}
					>
						<Text style={styles.registerButtonText}>
							{t("register")}
						</Text>
					</TouchableOpacity>

					{/* Google Sign-In Button */}
					<TouchableOpacity
						onPress={handleGoogle}
						disabled={googleLoading}
						style={{
							flexDirection: "row",
							backgroundColor: "#ffffff",
							borderRadius: 15,
							paddingVertical: 13,
							width: "100%",
							alignItems: "center",
							justifyContent: "center",
							marginTop: 12,
							borderWidth: 1,
							borderColor: "#d1d5db",
						}}
					>
						{googleLoading ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<>
								<Image
									source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
									style={{ width: 20, height: 20, marginRight: 10 }}
								/>
								<Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
									{t("continueWithGoogle")}
								</Text>
							</>
						)}
					</TouchableOpacity>

					<View
						style={styles.loginPromptContainer}
					>
						<TouchableOpacity onPress={() => router.push("/start")}>
							<Text style={styles.loginPromptText}>
								{t("alreadyHaveAccount")}{" "}
								<Text style={styles.loginPromptLink}>{t("loginHere")}</Text>
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	logoVideo: {
		width: 200,
		height: 200,
	},
	registerButton: {
		backgroundColor: "#f4bb26",
		borderRadius: 15,
		paddingVertical: 15,
		width: "100%",
		alignItems: "center",
		marginBottom: 12,
	},
	registerButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	loginPromptContainer: {
		alignItems: "center",
		marginTop: 10,
		marginBottom: 200,
	},
	loginPromptText: {
		color: "#000",
		fontSize: 18,
		fontWeight: "700",
	},
	loginPromptLink: {
		color: "#f4bb26",
		fontWeight: "700",
	},
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

"use client";

import AuthLogoVideo from "@/components/AuthLogoVideo";
import CityPicker from "@/components/CityPicker";
import IOSDatePickerModal from "@/components/IOSDatePickerModal";
import LoadingButton from "@/components/LoadingButton";
import LocationPickerMap, { type PickedLocation } from "@/components/LocationPickerMap";
import { globalStyles } from "@/constants/GlobalStyles";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAppleAuth } from "@/hooks/useAppleAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { ApiError, AuthService } from "@/services/api";
import { styles } from "@/styles/app/register.styles";
import type { AuthPayload } from "@/types";
import { detectCityFromLocation, getStateForCity, reverseGeocodePoint } from "@/utils/cityDetection";
import { formatLocalDate, toCalendarISOString } from "@/utils/date";
import { ensureDefaultCity, resolveGoogleAddress } from "@/utils/userCity";
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
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import type { InputBoxProps } from "@/types/app/register.types";

// ✅ Beirut fallback address used whenever the shopper denies the location
// permission (or GPS/reverse-geocoding fails). We never leave city/state/
// street empty, and the pin is dropped on Beirut city center.
const DEFAULT_CITY = "Beirut";
const DEFAULT_STATE = "Beirut";
const DEFAULT_STREET = "Beirut";
const DEFAULT_PIN = { latitude: 33.8938, longitude: 35.5018 };

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
		style={[styles.inputBoxWrapper, { backgroundColor: inputBg }]}
	>
		<TextInput
			placeholder={placeholder}
			value={value}
			onChangeText={onChangeText}
			secureTextEntry={secureTextEntry}
			keyboardType={keyboardType}
			style={[styles.inputBoxText, { color: inputText }]}
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
			// Always derive the Lebanese governorate from the resolved city rather
			// than trusting the raw geocoded region text.
			const derivedState = getStateForCity(result.city) || result.region || "";
			setStateVal((prev) => (manual ? derivedState : prev || derivedState));
			if (
				typeof result.latitude === "number" &&
				typeof result.longitude === "number"
			) {
				const accuratePin = { latitude: result.latitude, longitude: result.longitude };
				setPin((prev) => (manual ? accuratePin : prev || accuratePin));
			}
			setLocationStatus("done");
		} else {
			// ✅ Permission denied / GPS off / no match — never leave the shopper
			// with empty address fields. Force the Beirut default (city, state,
			// street) and drop the pin on Beirut city center so registration can
			// still complete with a valid, usable address.
			setCity((prev) => (manual ? DEFAULT_CITY : prev || DEFAULT_CITY));
			setStreet((prev) => (manual ? DEFAULT_STREET : prev || DEFAULT_STREET));
			setStateVal((prev) => (manual ? DEFAULT_STATE : prev || DEFAULT_STATE));
			setPin((prev) => (manual ? DEFAULT_PIN : prev || DEFAULT_PIN));
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
				// Permission denied / GPS unavailable — fall back to the exact
				// Beirut city-center pin instead of blocking registration.
				finalPin = DEFAULT_PIN;
				setPin(DEFAULT_PIN);
				setLocationStatus("failed");
			}
		}

		// Never send empty address text fields — force the Beirut default.
		const finalCity = city?.trim() || DEFAULT_CITY;
		const finalStreet = street?.trim() || DEFAULT_STREET;
		const finalState = stateVal?.trim() || DEFAULT_STATE;

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
				street: finalStreet,
				city: finalCity,
				state: finalState,
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
				// Resolve the address up-front (GPS when allowed, otherwise the
				// Beirut default + Beirut pin) and send it with the token so the
				// backend force-saves a complete address on this sign-up.
				const googleAddress = await resolveGoogleAddress();
				const res = await AuthService.googleSignIn(idToken, googleAddress);
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
		(message) => {
			// Always surface Google Sign-In failures (e.g. DEVELOPER_ERROR from a
			// SHA-1/OAuth client mismatch on the Play Store build) instead of
			// silently doing nothing.
			setGoogleLoading(false);
			Alert.alert(t("errorTitle"), message);
		},
	);

	const handleGoogle = async () => {
		if (!googleReady) {
			Alert.alert(t("errorTitle"), t("googleNotConfigured"));
			return;
		}
		try {
			await promptGoogle();
		} catch (error) {
			// Safety net in case anything still throws.
			Alert.alert(t("errorTitle"), (error as Error)?.message || "Google sign-in failed");
		}
	};

	// Sign in with Apple — the guideline 4.8 equivalent login option offered
	// alongside Google on iOS.
	const [appleLoading, setAppleLoading] = useState(false);
	const { signInAsync: promptApple, isAvailable: appleAvailable } = useAppleAuth(
		async (credential) => {
			setAppleLoading(true);
			try {
				const appleAddress = await resolveGoogleAddress();
				const res = await AuthService.appleSignIn({ ...credential, address: appleAddress });
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) {
					if (userData.isNewUser === false) {
						Alert.alert(t("accountExistsTitle"), t("accountExistsBody"), [
							{ text: "OK", onPress: () => router.replace("/start") },
						]);
						return;
					}
					await AsyncStorage.setItem(
						"userData",
						JSON.stringify(await ensureDefaultCity(userData)),
					);
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
				setAppleLoading(false);
			}
		},
		(message) => {
			setAppleLoading(false);
			Alert.alert(t("errorTitle"), message);
		},
	);

	const handleApple = async () => {
		if (!appleAvailable) {
			Alert.alert(t("errorTitle"), t("appleNotAvailable"));
			return;
		}
		await promptApple();
	};

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={styles.scrollContent}
			>
				{/* Top Yellow Section */}
				<View
					style={[styles.topBanner, { height: screenHeight * 0.4 }]}
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
				<View style={styles.bottomInputsContainer}>
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
						style={[styles.phoneRow, { backgroundColor: inputBg }]}
					>
						<Text
							style={[styles.countryCodeText, { color: inputText }]}
						>
							{countryCode}
						</Text>
						<View style={styles.phoneDivider} />
						<TextInput
							placeholder={t("phoneRequired")}
							keyboardType="phone-pad"
							value={phone}
							onChangeText={(text) => setPhone(text.replace(/[^\d]/g, "").slice(0, 8))}
							maxLength={8}
							style={[styles.phoneInput, { color: inputText }]}
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

{Platform.OS === "android" && showDatePicker && (
  <DateTimePicker
    value={dateOfBirth || new Date(2000, 0, 1)}
    mode="date"
    display="default"
    maximumDate={new Date()} // 🔒 no future dates
    onChange={(event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) setDateOfBirth(selectedDate);
    }}
  />
)}

<IOSDatePickerModal
  visible={Platform.OS === "ios" && showDatePicker}
  value={dateOfBirth || new Date(2000, 0, 1)}
  mode="date"
  maximumDate={new Date()} // 🔒 no future dates
  onConfirm={(selectedDate) => {
    setDateOfBirth(selectedDate);
    setShowDatePicker(false);
  }}
  onCancel={() => setShowDatePicker(false)}
/>



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
						style={[styles.passwordRow, { backgroundColor: inputBg }]}
					>
						<TextInput
							placeholder={t("password")}
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={setPassword}
							style={[styles.passwordInput, { color: inputText }]}
							placeholderTextColor={placeholderColor}
						/>
						<TouchableOpacity
							onPress={() => setShowPassword(!showPassword)}
							style={styles.eyeButton}
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
						style={styles.cityPicker}
					/>
					<TouchableOpacity
						onPress={() => runLocationDetection({ manual: true })}
						disabled={locationStatus === "detecting"}
						style={[
							styles.locationButton,
							{ backgroundColor: locationStatus === "done" ? "#eafaf0" : "#fff8e6" },
						]}
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
							style={[
								styles.locationButtonText,
								{ color: locationStatus === "done" ? "#22a45d" : "#7a6a2e" },
							]}
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
						style={[
							styles.mapPinButton,
							{ backgroundColor: pin ? "#eafaf0" : "#f3f4f6" },
						]}
					>
						<Feather
							name="map"
							size={18}
							color={pin ? "#22a45d" : "#555555"}
						/>
						<Text
							style={[
								styles.mapPinButtonText,
								{ color: pin ? "#22a45d" : "#333333" },
							]}
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
									// Always derive the Lebanese governorate from the resolved
									// city rather than trusting the raw geocoded region text.
									const derivedState = getStateForCity(addr?.city) || addr?.region;
									if (derivedState) setStateVal(derivedState);
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
					<LoadingButton
						onPress={handleRegister}
						style={styles.registerButton}
						loadingColor="#000"
					>
						<Text style={styles.registerButtonText}>
							{t("register")}
						</Text>
					</LoadingButton>

					{/* Google Sign-In Button */}
					<TouchableOpacity
						onPress={handleGoogle}
						disabled={googleLoading}
						style={styles.googleButton}
					>
						{googleLoading ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<>
								<Image
									source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
									style={[globalStyles.size20, globalStyles.marginRight10]}
								/>
								<Text style={styles.googleButtonText}>
									{t("continueWithGoogle")}
								</Text>
							</>
						)}
					</TouchableOpacity>

					{/* Sign in with Apple (iOS only) — required by App Store guideline 4.8 */}
					{Platform.OS === "ios" && appleAvailable && (
						<TouchableOpacity
							onPress={handleApple}
							disabled={appleLoading}
							style={styles.appleButton}
						>
							{appleLoading ? (
								<ActivityIndicator size="small" color="#ffffff" />
							) : (
								<>
									<Ionicons
										name="logo-apple"
										size={20}
										color="#ffffff"
										style={globalStyles.marginRight10}
									/>
									<Text style={styles.appleButtonText}>
										{t("continueWithApple")}
									</Text>
								</>
							)}
						</TouchableOpacity>
					)}

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

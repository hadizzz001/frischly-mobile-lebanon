"use client";

import AuthLogoVideo from "@/components/AuthLogoVideo";
import { SERVER_BASE_URL } from "@/constants/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { syncPushTokenToServer } from "@/hooks/useNotifications";
import { ApiError, AuthService } from "@/services/api";
import type { AuthPayload } from "@/types";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function Start() {
	const { t, language, switchLanguage } = useTranslation();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const router = useRouter();
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const languages = [
		{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
		{ code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },
	];

	const screenHeight = Dimensions.get("window").height;

	const selectedLang = languages.find((l) => l.code === language) || languages[0];

	// Persist an authenticated session and go to the app.
	const persistAuth = async (userData: AuthPayload) => {
		await AsyncStorage.setItem("userData", JSON.stringify(userData));
		await AsyncStorage.setItem("guest", "false");
		syncPushTokenToServer();
		router.replace("/(tabs)");
	};

	const handleLogin = async () => {
		if (!identifier || !password) {
			Alert.alert(t("errorTitle"), t("phoneOrEmailRequired"));
			return;
		}
		setLoading(true);
		try {
			// Phone number is the primary identifier; email is still accepted.
			const isEmail = identifier.includes("@");
			const credentials = isEmail
				? { email: identifier.trim().toLowerCase(), password }
				: { phone: identifier.trim(), password };
			const res = await AuthService.loginProfile(credentials);

			const userData = res.data as unknown as AuthPayload | null;

			console.log("Login response:", userData?.user);

			// ✅ Check if user data exists and the account has been verified (either
			// via the phone SMS/WhatsApp link, or — for older accounts — via email).
			if (userData) {
					if (
						(userData.user as { emailConfirmed?: boolean })?.emailConfirmed === true ||
						(userData.user as { phoneVerified?: boolean })?.phoneVerified === true
					) {
					await persistAuth(userData);
				} else {
					Alert.alert(t("accountNotVerified"), t("verifyAccount"));
				}
			} else {
				Alert.alert(t("loginFailed"), t("invalidCredentials"));
			}
		} catch (error) {
			const payload =
				error instanceof ApiError
					? (error.payload as { message?: string; error?: string } | null)
					: null;
			console.log(
				"Login error:",
				payload || (error as Error)?.message,
			);

			// Extract exact backend message
			const backendMessage =
				payload?.message ||
				payload?.error ||
				(error as Error)?.message ||
				"Unknown error occurred";

			Alert.alert(t("loginFailed"), backendMessage);
		} finally {
			setLoading(false);
		}
	};

	// Google sign-in via the native Google SDK. `promptGoogle` opens the native
	// account picker and resolves with an ID token which we exchange with our
	// backend for an app session.
	const { promptAsync: promptGoogle, isReady: googleReady } = useGoogleAuth(
		async (idToken) => {
			setGoogleLoading(true);
			try {
				const res = await AuthService.googleSignIn(idToken);
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) {
					await persistAuth(userData);
				} else {
					Alert.alert(t("loginFailed"), t("invalidCredentials"));
				}
			} catch (error) {
				const payload =
					error instanceof ApiError
						? (error.payload as { message?: string; error?: string } | null)
						: null;
				Alert.alert(
					t("loginFailed"),
					payload?.message || payload?.error || (error as Error)?.message || "Google sign-in failed",
				);
			} finally {
				setGoogleLoading(false);
			}
		},
	);

	const handleGoogle = async () => {
		if (!googleReady) {
			Alert.alert(t("loginFailed"), t("googleNotConfigured"));
			return;
		}
		await promptGoogle();
	};

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	return (
		<KeyboardAvoidingView
			style={{ flex: 1, backgroundColor: "#FFFFFF" }}
			behavior="padding"
		>
			<ScrollView
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
			>
				{/* Top 40% yellow background */}
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
					<AuthLogoVideo style={{ width: 200, height: 200 }} />
				</View>

				{/* Bottom 60% content */}
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						paddingHorizontal: 24,
						backgroundColor: "#ffffff",
					}}
				>
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
					{/* Phone (primary) or email input */}
					<View
						style={{
							marginBottom: 12,
							width: "100%",
							borderWidth: 1,
							borderColor: "#d1d5db",
							borderRadius: 12,
							backgroundColor: inputBg,
						}}
					>
						<TextInput
							placeholder={t("phoneOrEmail")}
							keyboardType="default"
							autoCapitalize="none"
							value={identifier}
							onChangeText={setIdentifier}
							style={{ padding: 15, color: inputText }}
							placeholderTextColor={placeholderColor}
						/>
					</View>

					{/* Password input with eye icon */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 24,
							width: "100%",
							borderWidth: 1,
							borderColor: "#d1d5db",
							borderRadius: 12,
							backgroundColor: inputBg,
						}}
					>
						<TextInput
							placeholder={t("password")}
							secureTextEntry={!showPassword}
							value={password}
							onChangeText={setPassword}
							style={{
								flex: 1,
								padding: 15,
								color: inputText,
							}}
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

					{/* Login Button */}
					<TouchableOpacity
						onPress={handleLogin}
						disabled={loading}
						style={{
							backgroundColor: loading ? "#cccccc" : "#f4bb26",
							borderRadius: 15,
							paddingVertical: 15,
							width: "100%",
							alignItems: "center",
							marginBottom: 12,
						}}
					>
						{loading ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<Text
								style={{ color: "#ffffff", fontWeight: "bold", fontSize: 18 }}
							>
								{t("login")}
							</Text>
						)}
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
							marginBottom: 16,
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

					<TouchableOpacity onPress={() => router.push("/register")}>
						<Text style={{ color: "#000", fontSize: 18, fontWeight: "700" }}>
							{t("noAccount")}{" "}
							<Text style={{ color: "#f4bb26", fontWeight: "700" }}>{t("register")}</Text>
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={async () => {
							router.push(
							`${SERVER_BASE_URL}/forgot-password.html` as never
							);
						}}
					>
						<Text style={{ fontSize: 18, textAlign: "center", fontWeight: "700" }}>
							<Text style={{ color: "#000" }}>
								<Text style={{ color: "#f4bb26" }}>{t("forget")}</Text>
							</Text>
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={async () => {
							await AsyncStorage.setItem("guest", "true"); // 👈 mark as guest
							router.replace("/(tabs)");
						}}
					>
						<Text style={{ fontSize: 18, textAlign: "center", fontWeight: "700" }}>
							<Text style={{ color: "#000" }}>
								{t("continue")}{" "}
								<Text style={{ color: "#f4bb26" }}>{t("asGuest")}</Text>
							</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	dropdownContainer: {
		width: "100%",
		alignItems: "center",
		marginBottom: 40,
		zIndex: 9999, // 🔥 FIX: ensures it appears above everything
	},

	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
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

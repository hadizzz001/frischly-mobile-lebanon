"use client";

import AuthLogoVideo from "@/components/AuthLogoVideo";
import { SERVER_BASE_URL } from "@/constants/api";
import { globalStyles } from "@/constants/GlobalStyles";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAppleAuth } from "@/hooks/useAppleAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { syncPushTokenToServer } from "@/hooks/useNotifications";
import { ApiError, AuthService } from "@/services/api";
import type { AuthPayload } from "@/types";
import { ensureDefaultCity, resolveGoogleAddress } from "@/utils/userCity";
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
    Platform,
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
	const [appleLoading, setAppleLoading] = useState(false);
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

			// ✅ Check if user data exists and the account has been verified via
			// the email confirmation link.
			if (userData) {
					if ((userData.user as { emailConfirmed?: boolean })?.emailConfirmed === true) {
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
				// Resolve the address up-front (GPS when allowed, otherwise the
				// Beirut default + Beirut pin) and send it with the token so the
				// backend force-saves a complete address on this login.
				const address = await resolveGoogleAddress();
				const res = await AuthService.googleSignIn(idToken, address);
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) {
					await persistAuth(await ensureDefaultCity(userData));
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
		(message) => {
			// Always surface Google Sign-In failures (e.g. DEVELOPER_ERROR from a
			// SHA-1/OAuth client mismatch on the Play Store build) instead of
			// silently doing nothing.
			setGoogleLoading(false);
			Alert.alert(t("loginFailed"), message);
		},
	);

	const handleGoogle = async () => {
		if (!googleReady) {
			Alert.alert(t("loginFailed"), t("googleNotConfigured"));
			return;
		}
		try {
			await promptGoogle();
		} catch (error) {
			// Safety net in case anything still throws.
			Alert.alert(t("loginFailed"), (error as Error)?.message || "Google sign-in failed");
		}
	};

	// Sign in with Apple — the guideline 4.8 equivalent login option offered
	// alongside Google on iOS.
	const { signInAsync: promptApple, isAvailable: appleAvailable } = useAppleAuth(
		async (credential) => {
			setAppleLoading(true);
			try {
				const address = await resolveGoogleAddress();
				const res = await AuthService.appleSignIn({ ...credential, address });
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) {
					await persistAuth(await ensureDefaultCity(userData));
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
					payload?.message || payload?.error || (error as Error)?.message || "Apple sign-in failed",
				);
			} finally {
				setAppleLoading(false);
			}
		},
		(message) => {
			setAppleLoading(false);
			Alert.alert(t("loginFailed"), message);
		},
	);

	const handleApple = async () => {
		if (!appleAvailable) {
			Alert.alert(t("loginFailed"), t("appleNotAvailable"));
			return;
		}
		await promptApple();
	};

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	return (
		<KeyboardAvoidingView
			style={styles.screen}
			behavior="padding"
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				{/* Top 40% yellow background */}
				<View
					style={[styles.topBanner, { height: screenHeight * 0.4 }]}
				>
					<AuthLogoVideo style={styles.logoVideo} />
				</View>

				{/* Bottom 60% content */}
				<View
					style={styles.bottomContent}
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
						style={[styles.inputWrapper, { backgroundColor: inputBg }]}
					>
						<TextInput
							placeholder={t("phoneOrEmail")}
							keyboardType="default"
							autoCapitalize="none"
							value={identifier}
							onChangeText={setIdentifier}
							style={[styles.textInput, { color: inputText }]}
							placeholderTextColor={placeholderColor}
						/>
					</View>

					{/* Password input with eye icon */}
					<View
						style={[styles.passwordWrapper, { backgroundColor: inputBg }]}
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

					{/* Login Button */}
					<TouchableOpacity
						onPress={handleLogin}
						disabled={loading}
						style={[
							styles.loginButton,
							{ backgroundColor: loading ? "#cccccc" : "#f4bb26" },
						]}
					>
						{loading ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<Text
								style={globalStyles.whiteBoldText18}
							>
								{t("login")}
							</Text>
						)}
					</TouchableOpacity>

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

					<TouchableOpacity onPress={() => router.push("/register")}>
						<Text style={styles.noAccountText}>
							{t("noAccount")}{" "}
							<Text style={styles.registerLink}>{t("register")}</Text>
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={async () => {
							router.push(
							`${SERVER_BASE_URL}/forgot-password.html` as never
							);
						}}
					>
						<Text style={styles.centerBoldText}>
							<Text style={styles.blackText}>
								<Text style={styles.registerLink}>{t("forget")}</Text>
							</Text>
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={async () => {
							await AsyncStorage.setItem("guest", "true"); // 👈 mark as guest
							router.replace("/(tabs)");
						}}
					>
						<Text style={styles.centerBoldText}>
							<Text style={styles.blackText}>
								{t("continue")}{" "}
								<Text style={styles.registerLink}>{t("asGuest")}</Text>
							</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#FFFFFF" },
	scrollContent: { flexGrow: 1 },
	topBanner: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f4bb26",
		borderBottomLeftRadius: 60,
		borderBottomRightRadius: 60,
		overflow: "hidden",
	},
	logoVideo: { width: 200, height: 200 },
	bottomContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		backgroundColor: "#ffffff",
	},
	inputWrapper: {
		marginBottom: 12,
		width: "100%",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
	},
	textInput: { padding: 15 },
	passwordWrapper: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
		width: "100%",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
	},
	passwordInput: { flex: 1, padding: 15 },
	eyeButton: { paddingHorizontal: 10 },
	loginButton: {
		borderRadius: 15,
		paddingVertical: 15,
		width: "100%",
		alignItems: "center",
		marginBottom: 12,
	},
	googleButton: {
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
	},
	googleButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },
	appleButton: {
		flexDirection: "row",
		backgroundColor: "#000000",
		borderRadius: 15,
		paddingVertical: 13,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 12,
	},
	appleButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
	noAccountText: { color: "#000", fontSize: 18, fontWeight: "700" },
	registerLink: { color: "#f4bb26", fontWeight: "700" },
	centerBoldText: { fontSize: 18, textAlign: "center", fontWeight: "700" },
	blackText: { color: "#000" },
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

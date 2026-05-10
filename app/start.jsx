"use client";

import { useTranslation } from "@/contexts/TranslationContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
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
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const languages = [
		{ code: "en", name: "English", flag: "https://flagcdn.com/w40/gb.png" },
		{ code: "ar", name: "العربية", flag: "https://flagcdn.com/w40/lb.png" },
	];

	const screenHeight = Dimensions.get("window").height;

	const selectedLang = languages.find((l) => l.code === language) || languages[0];

	const handleLogin = async () => {
		if (!email || !password) {
			Alert.alert(t("errorTitle"), t("emailRequired"));
			return;
		}

		setLoading(true);
		try {
			const res = await axios.post(
				"https://frischly-dash-leb.onrender.com/api/auth/login-profile",
				{ email, password }
			);

			console.log("Login response:", res.data.data.user.emailConfirmed);

			const userData = res.data?.data;

			// ✅ Check if user data exists and email is confirmed
			if (userData) {
				if (userData.user.emailConfirmed === true) {
					// ✅ Save user data and redirect
					await AsyncStorage.setItem("userData", JSON.stringify(userData));
					await AsyncStorage.setItem("guest", "false");
					router.replace("/(tabs)");
				} else {
					Alert.alert(t("emailNotVerified"), t("verifyEmail"));
				}
			} else {
				Alert.alert(t("loginFailed"), t("invalidCredentials"));
			}
		} catch (error) {
			console.log("Login error:", error.response?.data || error.message);

			// Extract exact backend message
			const backendMessage =
				error.response?.data?.message ||
				error.response?.data?.error ||
				error.message ||
				"Unknown error occurred";

			Alert.alert(t("loginFailed"), backendMessage);
		} finally {
			setLoading(false);
		}
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
					<Image
						source={{
							uri: "https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1__1_-removebg-preview_mkv83g.png",
						}}
						style={{ width: 200, height: 200 }}
						resizeMode="contain"
					/>
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
					{/* Email input */}
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginBottom: 12,
							width: "100%",
							borderWidth: 1,
							borderColor: "#d1d5db",
							borderRadius: 12,
							backgroundColor: inputBg,
						}}
					>
						<TextInput
							placeholder={t("email")}
							keyboardType="email-address"
							value={email}
							onChangeText={setEmail}
							style={{
								flex: 1,
								padding: 15,
								color: inputText,
							}}
							placeholderTextColor={placeholderColor}
							autoCapitalize="none"
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

					<TouchableOpacity onPress={() => router.push("/register")}>
						<Text style={{ color: "#000", fontSize: 16 }}>
							{t("noAccount")}{" "}
							<Text style={{ color: "#f4bb26" }}>{t("register")}</Text>
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={async () => {
							router.push(
								"https://frischly-dash-leb.onrender.com/forgot-password.html"
							);
						}}
					>
						<Text style={{ fontSize: 16, textAlign: "center" }}>
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
						<Text style={{ fontSize: 16, textAlign: "center" }}>
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

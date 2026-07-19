"use client";

import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface VisiblePasswordInputProps {
	value: string;
	onChangeText: (text: string) => void;
	placeholder: string;
}

// Simple visible password input
function VisiblePasswordInput({ value, onChangeText, placeholder }: VisiblePasswordInputProps) {
	return (
		<View style={styles.inputContainer}>
			<TextInput
				value={value}
				onChangeText={onChangeText}
				placeholder={placeholder}
				style={styles.input}
				autoCapitalize="none"
				placeholderTextColor="#888"
			/>
		</View>
	);
}

export default function ChangePassword() {
	const { t } = useTranslation();

	const router = useRouter();
	const [currentPassword, setCurrentPassword] = useState<string>("");
	const [newPassword, setNewPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(false);

	const screenHeight = Dimensions.get("window").height;

	useEffect(() => {
		const checkLogin = async (): Promise<void> => {
			const userData = await AsyncStorage.getItem("userData");
			if (!userData) router.replace("/start");
		};
		checkLogin();
	}, []);

	const handleChangePassword = async (): Promise<void> => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			return Alert.alert(t("errorTitle"), t("fillAllFields"));
		}
		if (newPassword !== confirmPassword) {
			return Alert.alert(t("errorTitle"), t("passwordMismatch"));
		}

		setLoading(true);
		try {
			const userData = await AsyncStorage.getItem("userData");
			const token = userData ? JSON.parse(userData)?.token : null;
			if (!token)
				return Alert.alert(t("errorTitle"), t("userNotAuthenticated"));

			const res = await AuthService.changePassword({
				currentPassword,
				newPassword,
			});

			if (res?.success) {
				Alert.alert(t("success"), res.message);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				Alert.alert(
					t("errorTitle"),
					res?.message || t("failedUpdatePassword")
				);
			}
		} catch (error) {
			console.error("Change password error:", error);
			Alert.alert(t("errorTitle"), t("somethingWrong"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<KeyboardAvoidingView
			style={styles.flexWhite}
			behavior="padding"
		>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
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
					<Text style={styles.headerTitle}>
						{t("changePassword")}
					</Text>
				</View>

				<View style={styles.formContainer}>
					<VisiblePasswordInput
						value={currentPassword}
						onChangeText={setCurrentPassword}
						placeholder={t("currentPassword")}
					/>
					<VisiblePasswordInput
						value={newPassword}
						onChangeText={setNewPassword}
						placeholder={t("newPassword")}
					/>
					<VisiblePasswordInput
						value={confirmPassword}
						onChangeText={setConfirmPassword}
						placeholder={t("confirmNewPassword")}
					/>

					<TouchableOpacity
						onPress={handleChangePassword}
						disabled={loading}
						style={{
							backgroundColor: loading ? "#cccccc" : "#f4bb26",
							borderRadius: 15,
							paddingVertical: 15,
							width: "100%",
							alignItems: "center",
							marginTop: 20,
						}}
					>
						{loading ? (
							<ActivityIndicator size="small" color="#000" />
						) : (
							<Text style={styles.updateButtonText}>
								{t("updatePassword")}
							</Text>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.bottomSpacer} />
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	flexWhite: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollContent: {
		flexGrow: 1,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#000",
	},
	formContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		backgroundColor: "#fff",
		marginTop: 30,
	},
	updateButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	bottomSpacer: {
		height: 200,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
		backgroundColor: "#fff",
		marginBottom: 12,
	},
	input: {
		flex: 1,
		padding: 15,
		color: "#000",
	},
});

"use client";

import { SCREEN_HEIGHT } from "@/constants/layout";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { styles } from "@/styles/app/changepass.styles";
import {
	ActivityIndicator,
	Alert,
	KeyboardAvoidingView,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import type { VisiblePasswordInputProps } from "@/types/app/changepass.types";

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

	const screenHeight = SCREEN_HEIGHT;

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
					style={[styles.topBanner, { height: screenHeight * 0.4 }]}
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
						style={[
							styles.updateButton,
							{ backgroundColor: loading ? "#cccccc" : "#f4bb26" },
						]}
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

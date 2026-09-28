"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { syncPushTokenToServer } from "@/hooks/useNotifications";
import { ApiError, AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import type { AuthPayload } from "@/types";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { isStrongPassword, passwordRules } from "@/utils/phone";

// Native password reset — screen 3 of 3: new password with live rules and a
// visibility toggle. On success we sign the shopper in with the new password
// and drop them straight onto the home feed.
export default function ResetPassword() {
	const { t } = useTranslation();
	const router = useRouter();
	const { token = "", email = "" } = useLocalSearchParams<{ token?: string; email?: string }>();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [show, setShow] = useState(false);
	const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const rules = passwordRules(password);
	const ruleRows: { key: keyof typeof rules; label: string }[] = [
		{ key: "length", label: t("passwordRuleLength") },
		{ key: "upper", label: t("passwordRuleUpper") },
		{ key: "lower", label: t("passwordRuleLower") },
		{ key: "number", label: t("passwordRuleNumber") },
	];

	const submit = async () => {
		const next: typeof errors = {};
		if (!password) next.password = t("fieldRequired");
		else if (!isStrongPassword(password)) next.password = t("passwordTooWeak");
		if (confirm !== password) next.confirm = t("passwordsDontMatch");
		setErrors(next);
		setFormError(null);
		if (Object.keys(next).length) return notifyError();

		setLoading(true);
		try {
			await AuthService.resetPassword(String(token), password);
			// Auto-authenticate with the new password.
			try {
				const res = await AuthService.loginProfile({ email: String(email).toLowerCase(), password });
				const userData = res.data as unknown as AuthPayload | null;
				if (userData?.token) {
					await AsyncStorage.setItem("userData", JSON.stringify(userData));
					await AsyncStorage.setItem("guest", "false");
					syncPushTokenToServer();
					notifySuccess();
					router.replace("/(tabs)");
					return;
				}
			} catch {
				// fall through to the login screen with a success notice
			}
			notifySuccess();
			router.replace({ pathname: "/start", params: { reset: "1" } } as never);
		} catch (err) {
			notifyError();
			const message = err instanceof ApiError ? (err.payload as { message?: string } | null)?.message : undefined;
			setFormError(message || t("resetFailed"));
		} finally {
			setLoading(false);
		}
	};

	const eye = (
		<Pressable onPress={() => setShow((v) => !v)} style={styles.eyeButton} hitSlop={8} accessibilityRole="button">
			{show ? (
				<EyeOff size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
			) : (
				<Eye size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
			)}
		</Pressable>
	);

	return (
		<AuthLayout title={t("newPasswordTitle")} subtitle={t("newPasswordBody")} compact showBack hideLanguage>
			{formError ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{formError}</Text>
				</View>
			) : null}
			<FormField
				label={t("newPasswordLabel")}
				required
				value={password}
				onChangeText={(v) => {
					setPassword(v);
					if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
				}}
				secureTextEntry={!show}
				autoCapitalize="none"
				autoComplete="new-password"
				textContentType="newPassword"
				autoFocus
				error={errors.password}
				right={eye}
			/>
			<View style={styles.rules}>
				{ruleRows.map((r) => (
					<View key={r.key} style={styles.ruleRow}>
						{rules[r.key] ? (
							<CircleCheck size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.success} />
						) : (
							<Check size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.textDisabled} />
						)}
						<Text style={[styles.ruleText, rules[r.key] && styles.ruleTextOk]}>{r.label}</Text>
					</View>
				))}
			</View>
			<FormField
				label={t("confirmPasswordLabel")}
				required
				value={confirm}
				onChangeText={(v) => {
					setConfirm(v);
					if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
				}}
				secureTextEntry={!show}
				autoCapitalize="none"
				textContentType="newPassword"
				returnKeyType="done"
				onSubmitEditing={submit}
				error={errors.confirm}
				right={eye}
			/>
			<PrimaryButton label={t("savePassword")} onPress={submit} loading={loading} style={styles.primary} />
		</AuthLayout>
	);
}

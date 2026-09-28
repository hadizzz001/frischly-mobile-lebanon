"use client";

import { useRouter } from "expo-router";
import { CircleAlert, Mail } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import { notifyError, notifySuccess } from "@/utils/haptics";

// Native password reset — screen 1 of 3: identify the account. The backend
// emails a 6-digit code (plus the legacy link) and we move straight to the
// in-app code entry; no browser session is ever involved.
export default function ForgotPassword() {
	const { t } = useTranslation();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const submit = async () => {
		const value = email.trim().toLowerCase();
		setFormError(null);
		if (!value) return setError(t("fieldRequired"));
		if (!/^\S+@\S+\.\S+$/.test(value)) return setError(t("invalidEmail"));
		setError(null);
		setLoading(true);
		try {
			await AuthService.requestPasswordReset(value);
			notifySuccess();
			router.push({ pathname: "/verify-reset-code", params: { email: value } } as never);
		} catch {
			notifyError();
			setFormError(t("requestFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthLayout title={t("forgotPasswordTitle")} subtitle={t("forgotPasswordBody")} compact showBack hideLanguage>
			{formError ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{formError}</Text>
				</View>
			) : null}
			<FormField
				label={t("emailLabel")}
				required
				value={email}
				onChangeText={(v) => {
					setEmail(v);
					if (error) setError(null);
				}}
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="email"
				textContentType="emailAddress"
				returnKeyType="send"
				onSubmitEditing={submit}
				error={error}
				autoFocus
				left={<Mail size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
			/>
			<PrimaryButton label={t("sendCode")} onPress={submit} loading={loading} style={styles.primary} />
			<View style={styles.linksRow}>
				<Text style={[styles.linkText, styles.link]} onPress={() => router.replace("/start")}>
					{t("backToLogin")}
				</Text>
			</View>
		</AuthLayout>
	);
}

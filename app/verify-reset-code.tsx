"use client";

import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, CircleCheck } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { ApiError, AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import { notifyError, notifySuccess, tapLight } from "@/utils/haptics";
import { interpolate } from "@/utils/i18n";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

// Native password reset — screen 2 of 3: 6 code cells backed by one hidden
// input (so the OS autofill / SMS-code suggestion bar can paste the whole
// code), a resend countdown, and auto-submit when the last digit lands.
export default function VerifyResetCode() {
	const { t } = useTranslation();
	const router = useRouter();
	const { email = "" } = useLocalSearchParams<{ email?: string }>();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
	const [resending, setResending] = useState(false);
	const inputRef = useRef<TextInput>(null);
	const [focused, setFocused] = useState(true);

	useEffect(() => {
		if (secondsLeft <= 0) return;
		const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
		return () => clearTimeout(id);
	}, [secondsLeft]);

	const verify = async (value: string) => {
		if (value.length !== CODE_LENGTH || loading) return;
		setLoading(true);
		setError(null);
		try {
			const res = await AuthService.verifyResetCode(String(email), value);
			const token = (res?.data as { token?: string } | null)?.token;
			if (!token) throw new Error("no token");
			notifySuccess();
			router.replace({ pathname: "/reset-password", params: { token, email } } as never);
		} catch (err) {
			notifyError();
			const status = err instanceof ApiError ? err.status : 0;
			setError(status === 429 ? t("tooManyAttempts") : t("invalidCode"));
			setCode("");
		} finally {
			setLoading(false);
		}
	};

	const onChange = (raw: string) => {
		const digits = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
		if (digits.length > code.length) tapLight();
		setCode(digits);
		if (error) setError(null);
		if (digits.length === CODE_LENGTH) verify(digits);
	};

	const resend = async () => {
		if (secondsLeft > 0 || resending) return;
		setResending(true);
		try {
			await AuthService.requestPasswordReset(String(email));
			setNotice(t("codeResent"));
			setSecondsLeft(RESEND_SECONDS);
		} catch {
			setError(t("requestFailed"));
		} finally {
			setResending(false);
		}
	};

	const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
	const ss = String(secondsLeft % 60).padStart(2, "0");

	return (
		<AuthLayout
			title={t("enterCodeTitle")}
			subtitle={interpolate(t("codeSentBody"), { email: String(email) })}
			compact
			showBack
			hideLanguage
		>
			{notice && !error ? (
				<View style={styles.successBox}>
					<CircleCheck size={icon.size} strokeWidth={icon.strokeWidth} color={colors.success} />
					<Text style={styles.boxText}>{notice}</Text>
				</View>
			) : null}
			{error ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{error}</Text>
				</View>
			) : null}

			<Pressable onPress={() => inputRef.current?.focus()} style={styles.otpRow} accessibilityRole="button">
				{Array.from({ length: CODE_LENGTH }).map((_, i) => {
					const char = code[i] ?? "";
					const active = focused && i === Math.min(code.length, CODE_LENGTH - 1);
					return (
						<View
							key={i}
							style={[
								styles.otpCell,
								char && styles.otpCellFilled,
								active && styles.otpCellActive,
								!!error && styles.otpCellError,
							]}
						>
							<Text style={styles.otpText}>{char}</Text>
						</View>
					);
				})}
			</Pressable>
			<TextInput
				ref={inputRef}
				value={code}
				onChangeText={onChange}
				keyboardType="number-pad"
				textContentType="oneTimeCode"
				autoComplete="sms-otp"
				maxLength={CODE_LENGTH}
				autoFocus
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				style={styles.otpHidden}
				caretHidden
			/>

			<PrimaryButton
				label={t("verifyCode")}
				onPress={() => verify(code)}
				loading={loading}
				disabled={code.length !== CODE_LENGTH}
				style={styles.primary}
			/>

			<View style={styles.resendRow}>
				{secondsLeft > 0 ? (
					<Text style={styles.resendText}>{interpolate(t("resendCodeIn"), { time: `${mm}:${ss}` })}</Text>
				) : (
					<PrimaryButton label={t("resendCode")} variant="ghost" loading={resending} onPress={resend} />
				)}
			</View>
		</AuthLayout>
	);
}

"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, CircleCheck, Eye, EyeOff, Mail } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAppleAuth } from "@/hooks/useAppleAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { syncPushTokenToServer } from "@/hooks/useNotifications";
import { ApiError, AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import type { AuthPayload } from "@/types";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { ensureDefaultCity, resolveGoogleAddress } from "@/utils/userCity";

const APPLE_LOGO = "";

export default function Start() {
	const { t } = useTranslation();
	const router = useRouter();
	// Arriving from a successful registration / password reset.
	const params = useLocalSearchParams<{ registered?: string; reset?: string }>();

	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [appleLoading, setAppleLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
	const [formError, setFormError] = useState<string | null>(null);

	// Persist an authenticated session and go to the app.
	const persistAuth = async (userData: AuthPayload) => {
		await AsyncStorage.setItem("userData", JSON.stringify(userData));
		await AsyncStorage.setItem("guest", "false");
		syncPushTokenToServer();
		notifySuccess();
		router.replace("/(tabs)");
	};

	const backendMessage = (error: unknown, fallback: string) => {
		const payload =
			error instanceof ApiError ? (error.payload as { message?: string; error?: string } | null) : null;
		return payload?.message || payload?.error || (error as Error)?.message || fallback;
	};

	const handleLogin = async () => {
		const errors: typeof fieldErrors = {};
		if (!identifier.trim()) errors.identifier = t("fieldRequired");
		if (!password) errors.password = t("fieldRequired");
		setFieldErrors(errors);
		setFormError(null);
		if (Object.keys(errors).length) {
			notifyError();
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

			if (!userData) {
				setFormError(t("invalidCredentials"));
				notifyError();
				return;
			}
			if ((userData.user as { emailConfirmed?: boolean })?.emailConfirmed !== true) {
				setFormError(t("verifyAccount"));
				notifyError();
				return;
			}
			await persistAuth(userData);
		} catch (error) {
			notifyError();
			setFormError(backendMessage(error, t("invalidCredentials")));
		} finally {
			setLoading(false);
		}
	};

	// Google sign-in via the native Google SDK.
	const { promptAsync: promptGoogle, isReady: googleReady } = useGoogleAuth(
		async (idToken) => {
			setGoogleLoading(true);
			try {
				const address = await resolveGoogleAddress();
				const res = await AuthService.googleSignIn(idToken, address);
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) await persistAuth(await ensureDefaultCity(userData));
				else setFormError(t("invalidCredentials"));
			} catch (error) {
				setFormError(backendMessage(error, "Google sign-in failed"));
			} finally {
				setGoogleLoading(false);
			}
		},
		(message) => {
			setGoogleLoading(false);
			setFormError(message);
		},
	);

	const handleGoogle = async () => {
		if (!googleReady) {
			setFormError(t("googleNotConfigured"));
			return;
		}
		try {
			await promptGoogle();
		} catch (error) {
			setFormError((error as Error)?.message || "Google sign-in failed");
		}
	};

	// Sign in with Apple — App Store guideline 4.8 equivalent to Google.
	const { signInAsync: promptApple, isAvailable: appleAvailable } = useAppleAuth(
		async (credential) => {
			setAppleLoading(true);
			try {
				const address = await resolveGoogleAddress();
				const res = await AuthService.appleSignIn({ ...credential, address });
				const userData = res.data as unknown as AuthPayload | null;
				if (userData) await persistAuth(await ensureDefaultCity(userData));
				else setFormError(t("invalidCredentials"));
			} catch (error) {
				setFormError(backendMessage(error, "Apple sign-in failed"));
			} finally {
				setAppleLoading(false);
			}
		},
		(message) => {
			setAppleLoading(false);
			setFormError(message);
		},
	);

	const handleApple = async () => {
		if (!appleAvailable) {
			setFormError(t("appleNotAvailable"));
			return;
		}
		await promptApple();
	};

	return (
		<AuthLayout title={t("welcomeBack")} subtitle={t("loginSubtitle")} animatedLogo>
			{params.reset === "1" && !formError ? (
				<View style={styles.successBox}>
					<CircleCheck size={icon.size} strokeWidth={icon.strokeWidth} color={colors.success} />
					<Text style={styles.boxText}>{t("passwordResetSuccess")}</Text>
				</View>
			) : null}
			{params.registered === "1" && !formError ? (
				<View style={styles.successBox}>
					<CircleCheck size={icon.size} strokeWidth={icon.strokeWidth} color={colors.success} />
					<Text style={styles.boxText}>
						<Text style={{ fontWeight: "700" }}>{t("confirmEmailTitle")}</Text>
						{"\n"}
						{t("confirmEmailBody")}
					</Text>
				</View>
			) : null}
			{formError ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{formError}</Text>
				</View>
			) : null}

			<FormField
				label={t("phoneOrEmail")}
				ltr
				value={identifier}
				onChangeText={(v) => {
					setIdentifier(v);
					if (fieldErrors.identifier) setFieldErrors((e) => ({ ...e, identifier: undefined }));
				}}
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="username"
				textContentType="username"
				returnKeyType="next"
				error={fieldErrors.identifier}
				left={<Mail size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
			/>

			<FormField
				label={t("passwordLabel")}
				value={password}
				onChangeText={(v) => {
					setPassword(v);
					if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
				}}
				secureTextEntry={!showPassword}
				autoCapitalize="none"
				autoComplete="password"
				textContentType="password"
				returnKeyType="go"
				onSubmitEditing={handleLogin}
				error={fieldErrors.password}
				right={
					<Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton} hitSlop={8} accessibilityRole="button">
						{showPassword ? (
							<EyeOff size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
						) : (
							<Eye size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
						)}
					</Pressable>
				}
			/>

			<Pressable onPress={() => router.push("/forgot-password" as never)} style={{ alignSelf: "flex-end", marginTop: -8 }} hitSlop={8}>
				<Text style={styles.link}>{t("forget")}</Text>
			</Pressable>

			<PrimaryButton label={t("login")} onPress={handleLogin} loading={loading} style={[styles.primary, { marginTop: 16 }]} />

			<View style={styles.dividerRow}>
				<View style={styles.dividerLine} />
				<Text style={styles.dividerText}>{t("orContinueWith")}</Text>
				<View style={styles.dividerLine} />
			</View>

			<PrimaryButton
				label={t("continueWithGoogle")}
				variant="secondary"
				loading={googleLoading}
				onPress={handleGoogle}
				style={styles.social}
				icon={
					<Image
						source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
						style={styles.googleIcon}
						cachePolicy="memory-disk"
					/>
				}
			/>
			{Platform.OS === "ios" && appleAvailable && (
				<PrimaryButton
					label={t("continueWithApple")}
					variant="secondary"
					loading={appleLoading}
					onPress={handleApple}
					style={[styles.social, { backgroundColor: colors.text, borderColor: colors.text }]}
					textStyle={{ color: colors.textOnDark }}
					icon={<Text style={{ color: colors.textOnDark, fontSize: 18 }}>{APPLE_LOGO}</Text>}
				/>
			)}

			<View style={styles.linksRow}>
				<Pressable onPress={() => router.push("/register")} hitSlop={8}>
					<Text style={styles.linkText}>
						{t("noAccount")} <Text style={styles.link}>{t("register")}</Text>
					</Text>
				</Pressable>
				<Pressable
					onPress={async () => {
						await AsyncStorage.setItem("guest", "true");
						router.replace("/(tabs)");
					}}
					hitSlop={8}
				>
					<Text style={[styles.linkText, styles.link]}>{t("continueAsGuest")}</Text>
				</Pressable>
			</View>
		</AuthLayout>
	);
}

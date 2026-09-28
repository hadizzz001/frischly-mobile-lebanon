"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Calendar, Check, CircleAlert, CircleCheck, Eye, EyeOff, Mail, Phone, UserRound } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import IOSDatePickerModal from "@/components/IOSDatePickerModal";
import type { PickedLocation } from "@/components/LocationPickerMap";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { DEFAULT_CITY, DEFAULT_PIN, DEFAULT_STATE, DEFAULT_STREET } from "@/constants/address";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { useAppleAuth } from "@/hooks/useAppleAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { syncPushTokenToServer } from "@/hooks/useNotifications";
import { ApiError, AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import type { AuthPayload } from "@/types";
import { detectCityFromLocation, getStateForCity } from "@/utils/cityDetection";
import { formatLocalDate, toCalendarISOString } from "@/utils/date";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { formatLebanesePhoneInput, isStrongPassword, passwordRules } from "@/utils/phone";
import { ensureDefaultCity, resolveGoogleAddress } from "@/utils/userCity";

const APPLE_LOGO = "";

type Errors = Partial<Record<"name" | "phone" | "email" | "dob" | "password", string>>;

// Progressive profiling: sign-up asks only for name, phone, email, date of
// birth (18+ check for alcohol) and password. The delivery address is NOT a
// form field any more — it is resolved silently (GPS -> reverse geocode, or the
// Beirut default) so the backend's required address is satisfied, and the
// shopper sets their real delivery pin at their first checkout.
export default function Register() {
	const { t } = useTranslation();
	const router = useRouter();

	const [name, setName] = useState("");
	const [phone, setPhone] = useState(""); // masked "XX XXXXXX"
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [errors, setErrors] = useState<Errors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [appleLoading, setAppleLoading] = useState(false);

	// Silently resolved address (never shown on this screen).
	const detected = useRef<{
		city: string;
		street: string;
		state: string;
		pin: PickedLocation;
	} | null>(null);

	const checkLogin = useCallback(async (): Promise<void> => {
		const userData = await AsyncStorage.getItem("userData");
		if (userData) router.replace("/(tabs)");
	}, [router]);
	useEffect(() => {
		checkLogin();
	}, [checkLogin]);

	// Kick off detection on mount; any failure just means the Beirut default.
	useEffect(() => {
		detectCityFromLocation()
			.then((result) => {
				if (result?.city) {
					detected.current = {
						city: result.city,
						street: result.street || DEFAULT_STREET,
						state: getStateForCity(result.city) || result.region || DEFAULT_STATE,
						pin:
							typeof result.latitude === "number" && typeof result.longitude === "number"
								? { latitude: result.latitude, longitude: result.longitude }
								: DEFAULT_PIN,
					};
				}
			})
			.catch(() => {});
	}, []);

	const ageOf = (dob: Date): number => {
		const today = new Date();
		let age = today.getFullYear() - dob.getFullYear();
		const m = today.getMonth() - dob.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
		return age;
	};

	const validate = (): boolean => {
		const next: Errors = {};
		if (!name.trim()) next.name = t("fieldRequired");
		const phoneDigits = phone.replace(/\D/g, "").replace(/^0+/, "");
		if (!phoneDigits) next.phone = t("fieldRequired");
		else if (!/^\d{7,8}$/.test(phoneDigits)) next.phone = t("phoneMustBe78Digits");
		if (!email.trim()) next.email = t("fieldRequired");
		else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = t("invalidEmail");
		if (!dateOfBirth) next.dob = t("fieldRequired");
		else if (ageOf(dateOfBirth) < 18) next.dob = t("mustBe18");
		if (!password) next.password = t("fieldRequired");
		else if (!isStrongPassword(password)) next.password = t("passwordTooWeak");
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleRegister = async (): Promise<void> => {
		setFormError(null);
		if (!validate()) {
			notifyError();
			return;
		}
		setSubmitting(true);
		try {
			const address = detected.current ?? {
				city: DEFAULT_CITY,
				street: DEFAULT_STREET,
				state: DEFAULT_STATE,
				pin: DEFAULT_PIN,
			};
			const phoneDigits = phone.replace(/\D/g, "").replace(/^0+/, "");
			const payload = {
				name: name.trim(),
				dateOfBirth: toCalendarISOString(dateOfBirth),
				password,
				address: {
					street: address.street,
					city: address.city,
					state: address.state,
					country: "LB",
					location: address.pin,
				},
				email: email.trim().toLowerCase(),
				phoneNumber: `+961${phoneDigits}`,
			};
			const res = await AuthService.register(payload);
			if (res) {
				await AsyncStorage.setItem("userData", JSON.stringify(res.data));
				notifySuccess();
				router.replace({ pathname: "/start", params: { registered: "1" } } as never);
			}
		} catch (error) {
			notifyError();
			const message =
				error instanceof ApiError ? (error.payload as { message?: string } | null)?.message : undefined;
			setFormError(
				message?.includes("Validation failed") ? t("registerValidationFailed") : message || t("registerFailed"),
			);
		} finally {
			setSubmitting(false);
		}
	};

	const socialSuccess = async (userData: AuthPayload | null) => {
		if (!userData) return;
		if (userData.isNewUser === false) {
			// Already registered — don't silently log in from Register.
			setFormError(t("accountExistsBody"));
			return;
		}
		await AsyncStorage.setItem("userData", JSON.stringify(await ensureDefaultCity(userData)));
		await AsyncStorage.setItem("guest", "false");
		// Same as the login screen: a social sign-up lands in the app without
		// passing through /start, so register the push token here too.
		syncPushTokenToServer();
		notifySuccess();
		router.replace("/(tabs)");
	};
	const socialError = (error: unknown) => {
		const message =
			error instanceof ApiError ? (error.payload as { message?: string } | null)?.message : undefined;
		setFormError(message || t("registerFailed"));
	};

	const { promptAsync: promptGoogle, isReady: googleReady } = useGoogleAuth(
		async (idToken) => {
			setGoogleLoading(true);
			try {
				const res = await AuthService.googleSignIn(idToken, await resolveGoogleAddress());
				await socialSuccess(res.data as unknown as AuthPayload | null);
			} catch (error) {
				socialError(error);
			} finally {
				setGoogleLoading(false);
			}
		},
		(message) => {
			setGoogleLoading(false);
			setFormError(message);
		},
	);
	const { signInAsync: promptApple, isAvailable: appleAvailable } = useAppleAuth(
		async (credential) => {
			setAppleLoading(true);
			try {
				const res = await AuthService.appleSignIn({ ...credential, address: await resolveGoogleAddress() });
				await socialSuccess(res.data as unknown as AuthPayload | null);
			} catch (error) {
				socialError(error);
			} finally {
				setAppleLoading(false);
			}
		},
		(message) => {
			setAppleLoading(false);
			setFormError(message);
		},
	);

	const rules = passwordRules(password);
	const ruleRows: { key: keyof typeof rules; label: string }[] = [
		{ key: "length", label: t("passwordRuleLength") },
		{ key: "upper", label: t("passwordRuleUpper") },
		{ key: "lower", label: t("passwordRuleLower") },
		{ key: "number", label: t("passwordRuleNumber") },
	];
	const clearError = (key: keyof Errors) => {
		if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
	};

	return (
		<AuthLayout title={t("createAccountTitle")} subtitle={t("registerSubtitle")} compact showBack>
			{formError ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{formError}</Text>
				</View>
			) : null}

			<FormField
				label={t("nameLabel")}
				required
				value={name}
				onChangeText={(v) => {
					setName(v);
					clearError("name");
				}}
				autoCapitalize="words"
				autoComplete="name"
				textContentType="name"
				returnKeyType="next"
				error={errors.name}
				left={<UserRound size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
			/>

			<FormField
				label={t("phoneLabel")}
				required
				prefix="+961"
				value={phone}
				onChangeText={(v) => {
					setPhone(formatLebanesePhoneInput(v));
					clearError("phone");
				}}
				keyboardType="phone-pad"
				maxLength={9}
				autoComplete="tel"
				textContentType="telephoneNumber"
				placeholder="70 123456"
				hint={t("phoneHint")}
				error={errors.phone}
				left={<Phone size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
			/>

			<FormField
				label={t("emailLabel")}
				required
				value={email}
				onChangeText={(v) => {
					setEmail(v);
					clearError("email");
				}}
				keyboardType="email-address"
				autoCapitalize="none"
				autoCorrect={false}
				autoComplete="email"
				textContentType="emailAddress"
				returnKeyType="next"
				error={errors.email}
				left={<Mail size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />}
			/>

			<FormField
				label={t("dobLabel")}
				required
				value={dateOfBirth ? formatLocalDate(dateOfBirth) : ""}
				placeholder={t("selectDate")}
				onPressField={() => setShowDatePicker(true)}
				hint={t("dobHint")}
				error={errors.dob}
				left={<Calendar size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />}
			/>
			{Platform.OS === "android" && showDatePicker && (
				<DateTimePicker
					value={dateOfBirth || new Date(2000, 0, 1)}
					mode="date"
					display="default"
					maximumDate={new Date()}
					onChange={(event, selectedDate) => {
						setShowDatePicker(false);
						if (event.type === "set" && selectedDate) {
							setDateOfBirth(selectedDate);
							clearError("dob");
						}
					}}
				/>
			)}
			<IOSDatePickerModal
				visible={Platform.OS === "ios" && showDatePicker}
				value={dateOfBirth || new Date(2000, 0, 1)}
				mode="date"
				maximumDate={new Date()}
				title={t("dobLabel")}
				onConfirm={(selectedDate) => {
					setDateOfBirth(selectedDate);
					clearError("dob");
					setShowDatePicker(false);
				}}
				onCancel={() => setShowDatePicker(false)}
			/>

			<FormField
				label={t("passwordLabel")}
				required
				value={password}
				onChangeText={(v) => {
					setPassword(v);
					clearError("password");
				}}
				secureTextEntry={!showPassword}
				autoCapitalize="none"
				autoComplete="new-password"
				textContentType="newPassword"
				returnKeyType="done"
				error={errors.password}
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

			<PrimaryButton label={t("register")} onPress={handleRegister} loading={submitting} style={styles.primary} />

			<View style={styles.dividerRow}>
				<View style={styles.dividerLine} />
				<Text style={styles.dividerText}>{t("orContinueWith")}</Text>
				<View style={styles.dividerLine} />
			</View>
			<PrimaryButton
				label={t("continueWithGoogle")}
				variant="secondary"
				loading={googleLoading}
				onPress={async () => {
					if (!googleReady) return setFormError(t("googleNotConfigured"));
					try {
						await promptGoogle();
					} catch (error) {
						setFormError((error as Error)?.message || "Google sign-in failed");
					}
				}}
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
					onPress={() => promptApple()}
					style={[styles.social, { backgroundColor: colors.text, borderColor: colors.text }]}
					textStyle={{ color: colors.textOnDark }}
					icon={<Text style={{ color: colors.textOnDark, fontSize: 18 }}>{APPLE_LOGO}</Text>}
				/>
			)}

			<View style={styles.linksRow}>
				<Pressable onPress={() => router.push("/start")} hitSlop={8}>
					<Text style={styles.linkText}>
						{t("alreadyHaveAccount")} <Text style={styles.link}>{t("loginHere")}</Text>
					</Text>
				</Pressable>
			</View>
		</AuthLayout>
	);
}

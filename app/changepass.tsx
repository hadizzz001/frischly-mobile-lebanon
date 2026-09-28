"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Check, CircleAlert, CircleCheck, Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

import AuthLayout from "@/components/AuthLayout";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService } from "@/services/api";
import { styles } from "@/styles/components/AuthLayout.styles";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { isStrongPassword, passwordRules } from "@/utils/phone";

export default function ChangePassword() {
	const { t } = useTranslation();
	const router = useRouter();
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [show, setShow] = useState(false);
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		AsyncStorage.getItem("userData").then((userData) => {
			if (!userData) router.replace("/start");
		});
	}, [router]);

	const rules = passwordRules(newPassword);
	const ruleRows: { key: keyof typeof rules; label: string }[] = [
		{ key: "length", label: t("passwordRuleLength") },
		{ key: "upper", label: t("passwordRuleUpper") },
		{ key: "lower", label: t("passwordRuleLower") },
		{ key: "number", label: t("passwordRuleNumber") },
	];

	const handleChangePassword = async (): Promise<void> => {
		const next: typeof errors = {};
		if (!currentPassword) next.current = t("fieldRequired");
		if (!newPassword) next.next = t("fieldRequired");
		else if (!isStrongPassword(newPassword)) next.next = t("passwordTooWeak");
		if (confirmPassword !== newPassword) next.confirm = t("passwordsDontMatch");
		setErrors(next);
		setFormError(null);
		setNotice(null);
		if (Object.keys(next).length) return notifyError();

		setLoading(true);
		try {
			const res = await AuthService.changePassword({ currentPassword, newPassword });
			if (res?.success) {
				notifySuccess();
				setNotice(res.message || t("success"));
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				notifyError();
				setFormError(res?.message || t("failedUpdatePassword"));
			}
		} catch (error) {
			console.error("Change password error:", error);
			notifyError();
			setFormError(
				(error as { payload?: { message?: string } })?.payload?.message || t("somethingWrong"),
			);
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
		<AuthLayout title={t("changePassword")} subtitle={t("newPasswordBody")} compact showBack hideLanguage>
			{notice ? (
				<View style={styles.successBox}>
					<CircleCheck size={icon.size} strokeWidth={icon.strokeWidth} color={colors.success} />
					<Text style={styles.boxText}>{notice}</Text>
				</View>
			) : null}
			{formError ? (
				<View style={styles.errorBox}>
					<CircleAlert size={icon.size} strokeWidth={icon.strokeWidth} color={colors.danger} />
					<Text style={styles.boxText}>{formError}</Text>
				</View>
			) : null}
			<FormField
				label={t("currentPassword")}
				required
				value={currentPassword}
				onChangeText={(v) => {
					setCurrentPassword(v);
					if (errors.current) setErrors((e) => ({ ...e, current: undefined }));
				}}
				secureTextEntry={!show}
				autoCapitalize="none"
				textContentType="password"
				error={errors.current}
				right={eye}
			/>
			<FormField
				label={t("newPassword")}
				required
				value={newPassword}
				onChangeText={(v) => {
					setNewPassword(v);
					if (errors.next) setErrors((e) => ({ ...e, next: undefined }));
				}}
				secureTextEntry={!show}
				autoCapitalize="none"
				textContentType="newPassword"
				error={errors.next}
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
				label={t("confirmNewPassword")}
				required
				value={confirmPassword}
				onChangeText={(v) => {
					setConfirmPassword(v);
					if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }));
				}}
				secureTextEntry={!show}
				autoCapitalize="none"
				textContentType="newPassword"
				returnKeyType="done"
				onSubmitEditing={handleChangePassword}
				error={errors.confirm}
				right={eye}
			/>
			<PrimaryButton label={t("updatePassword")} onPress={handleChangePassword} loading={loading} style={styles.primary} />
		</AuthLayout>
	);
}

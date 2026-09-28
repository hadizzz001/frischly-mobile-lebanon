import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import {
	Bell,
	ChevronLeft,
	ChevronRight,
	ClockArrowLeft,
	Languages,
	Lock,
	LogOut,
	Mail,
	MapPin,
	Phone,
	Trash2,
	UserRound,
} from "lucide-react-native";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	DeviceEventEmitter,
	Linking,
	Pressable,
	ScrollView,
	Switch,
	Text,
	View,
} from "react-native";

import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import AppBottomSheet from "@/components/ui/AppBottomSheet";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import { API_BASE_URL } from "@/constants/api";
import { OPEN_CITY_PICKER } from "@/constants/events";
import { LANGUAGE_OPTIONS } from "@/constants/languages";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { removePushTokenFromServer } from "@/hooks/useNotifications";
import { AuthService } from "@/services/api";
import { styles } from "@/styles/app/(tabs)/acc.styles";
import type { User } from "@/types";
import { notifyError, notifySuccess, tapSelection } from "@/utils/haptics";
import { formatStreetLine } from "@/utils/userAddress";

// Profile: a grouped, tappable list (personal info, delivery address, orders,
// preferences, account actions) instead of a passive read-only form.
export default function AccScreen() {
	const { t, isRTL, language, switchLanguage, switching } = useTranslation();
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loadingUser, setLoadingUser] = useState(true);
	const [logoutOpen, setLogoutOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
	// Which row/action is in flight. Rows swap their chevron for a spinner the
	// moment they're tapped (navigation can take a beat on slower phones), and
	// logout/delete raise a full-screen loader so the tap is visibly "working".
	const [pending, setPending] = useState<string | null>(null);
	const [loggingOut, setLoggingOut] = useState(false);
	const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const Chevron = isRTL ? ChevronLeft : ChevronRight;

	// Navigate with feedback: mark the row busy, push, and clear the mark when
	// this screen regains focus (or after a safety timeout if the push failed).
	const go = (key: string, action: () => void) => {
		if (pending) return;
		setPending(key);
		if (pendingTimer.current) clearTimeout(pendingTimer.current);
		pendingTimer.current = setTimeout(() => setPending(null), 4000);
		requestAnimationFrame(action);
	};
	useEffect(
		() => () => {
			if (pendingTimer.current) clearTimeout(pendingTimer.current);
		},
		[],
	);

	// Re-fetch user data every time the screen comes into focus. Every read is
	// optional: a guest has no session at all and must still see this screen.
	useFocusEffect(
		useCallback(() => {
			let cancelled = false;
			setPending(null);
			(async () => {
				try {
					const userData = await AsyncStorage.getItem("userData");
					const guest = await AsyncStorage.getItem("guest");
					if (!userData && !guest) {
						router.replace("/start");
						return;
					}
					const token = userData ? JSON.parse(userData)?.token : null;
					if (!token) {
						if (!cancelled) setUser(null);
						return;
					}
					const res = await AuthService.me();
					const fresh = (res?.data as unknown as { user?: User } | null)?.user ?? null;
					if (!cancelled) setUser(fresh);
				} catch (err) {
					console.error("Profile fetch error:", err);
				} finally {
					if (!cancelled) setLoadingUser(false);
				}
				try {
					const perm = await Notifications.getPermissionsAsync();
					if (!cancelled) setPushEnabled(perm.granted);
				} catch {
					if (!cancelled) setPushEnabled(null);
				}
			})();
			return () => {
				cancelled = true;
			};
		}, [router]),
	);

	const handleLogout = async () => {
		if (loggingOut) return;
		setLoggingOut(true);
		setLogoutOpen(false);
		try {
			const raw = await AsyncStorage.getItem("userData");
			const token = raw ? JSON.parse(raw)?.token : null;
			await removePushTokenFromServer(token);
		} catch (e) {
			console.error(e);
		}
		await AsyncStorage.removeItem("userData");
		setLoggingOut(false);
		router.replace("/start");
	};

	const handleDeleteAccount = async () => {
		if (deleting) return;
		setDeleting(true);
		setDeleteError(null);
		try {
			const userData = await AsyncStorage.getItem("userData");
			const token = userData ? JSON.parse(userData)?.token : null;
			const res = await fetch(`${API_BASE_URL}/auth/delete-account`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				body: JSON.stringify({ password: passwordInput }),
			});
			if (res.ok) {
				notifySuccess();
				await AsyncStorage.removeItem("userData");
				setDeleteOpen(false);
				router.replace("/start");
			} else {
				const errorData = await res.json().catch(() => null);
				notifyError();
				setDeleteError(errorData?.message || t("failedDeleteAccount"));
			}
		} catch (err) {
			console.error(err);
			notifyError();
			setDeleteError(t("somethingWrong"));
		} finally {
			setDeleting(false);
		}
	};

	const togglePush = async (next: boolean) => {
		tapSelection();
		if (next) {
			const perm = await Notifications.requestPermissionsAsync();
			if (perm.granted) setPushEnabled(true);
			else Linking.openSettings();
		} else {
			// The OS owns the switch — send them to Settings to turn it off.
			Linking.openSettings();
		}
	};

	// --- tiles ------------------------------------------------------------------------
	const Tile = ({
		icon: Icon,
		label,
		value,
		title,
		hint,
		onPress,
		right,
		last,
		pendingKey,
	}: {
		icon: typeof Mail;
		label?: string;
		value?: string;
		title?: string;
		hint?: string;
		onPress?: () => void;
		right?: ReactNode;
		last?: boolean;
		/** Set on navigating rows: while `pending === pendingKey` the chevron
		 *  becomes a spinner. */
		pendingKey?: string;
	}) => (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => [
				styles.tile,
				isRTL && { flexDirection: "row-reverse" },
				last && styles.tileLast,
				pressed && onPress && styles.tilePressed,
			]}
			accessibilityRole={onPress ? "button" : undefined}
		>
			<View style={styles.iconPill}>
				<Icon size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textSecondary} />
			</View>
			<View style={styles.tileBody}>
				{label ? <Text style={styles.tileLabel}>{label}</Text> : null}
				{value !== undefined ? (
					<Text style={styles.tileValue} numberOfLines={1}>
						{value || t("notProvided")}
					</Text>
				) : null}
				{title ? <Text style={styles.tileTitle}>{title}</Text> : null}
				{hint ? <Text style={styles.tileHint}>{hint}</Text> : null}
			</View>
			{pendingKey && pending === pendingKey ? (
				<ActivityIndicator size="small" color={colors.primary} />
			) : (
				right ?? (onPress ? (
					<Chevron size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textDisabled} />
				) : null)
			)}
		</Pressable>
	);

	if (!loadingUser && !user) {
		return (
			<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
				<EmptyState
					illustration="basket"
					title={t("guestTitle")}
					description={t("guestBody")}
					actionLabel={t("login")}
					onAction={() => router.push("/start")}
					secondaryLabel={t("createAccount")}
					onSecondary={() => router.push("/register")}
				/>
			</ScrollView>
		);
	}

	const address = user?.address;
	const addressLine = formatStreetLine(address);

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
			<View style={styles.header}>
				<View style={styles.avatar}>
					<UserRound size={32} strokeWidth={icon.strokeWidth} color={colors.textSecondary} />
				</View>
				<Text style={styles.name}>{user?.name || t("myProfile")}</Text>
				<Text style={styles.subtitle}>{user?.email || user?.phoneNumber || t("manageAccount")}</Text>
			</View>

			{/* Personal information */}
			<Text style={styles.sectionTitle}>{t("personalInformation")}</Text>
			<View style={styles.group}>
				<Tile icon={UserRound} label={t("fullName")} value={user?.name ?? ""} pendingKey="name" onPress={() => go("name", () => router.push("/edit-profile"))} />
				<Tile icon={Mail} label={t("email")} value={user?.email ?? ""} pendingKey="email" onPress={() => go("email", () => router.push("/edit-profile"))} />
				<Tile icon={Phone} label={t("phoneNumber")} value={user?.phoneNumber ?? ""} pendingKey="phone" onPress={() => go("phone", () => router.push("/edit-profile"))} last />
			</View>

			{/* Delivery address */}
			<Text style={styles.sectionTitle}>{t("deliveryAddresses")}</Text>
			<View style={styles.group}>
				<Tile
					icon={MapPin}
					title={address?.city || t("selectCity")}
					hint={addressLine || t("manageAddress")}
					onPress={() => {
						tapSelection();
						DeviceEventEmitter.emit(OPEN_CITY_PICKER);
					}}
					right={
						<View style={[{ flexDirection: "row", alignItems: "center", gap: 8 }, isRTL && { flexDirection: "row-reverse" }]}>
							<View style={styles.tag}>
								<Text style={styles.tagText}>{t("defaultAddress")}</Text>
							</View>
							<Chevron size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textDisabled} />
						</View>
					}
					last
				/>
			</View>

			{/* Orders */}
			<Text style={styles.sectionTitle}>{t("orderHistory")}</Text>
			<View style={styles.group}>
				<Tile icon={ClockArrowLeft} title={t("viewOrders")} hint={t("orderHistoryHint")} pendingKey="orders" onPress={() => go("orders", () => router.push("/order"))} last />
			</View>

			{/* Preferences */}
			<Text style={styles.sectionTitle}>{t("preferences")}</Text>
			<View style={styles.group}>
				<Tile
					icon={Languages}
					title={t("language")}
					hint={switching ? t("switchingLanguage") : undefined}
					right={
						<View style={styles.segmented}>
							{LANGUAGE_OPTIONS.map((opt) => {
								const active = opt.code === language;
								return (
									<Pressable
										key={opt.code}
										disabled={switching}
										style={[styles.segment, active && styles.segmentActive]}
										onPress={() => {
											tapSelection();
											switchLanguage(opt.code);
										}}
										accessibilityRole="button"
										accessibilityState={{ selected: active }}
									>
										<Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.name}</Text>
									</Pressable>
								);
							})}
						</View>
					}
				/>
				<Tile
					icon={Bell}
					title={t("pushNotifications")}
					hint={t("pushNotificationsHint")}
					right={
						<Switch
							value={!!pushEnabled}
							onValueChange={togglePush}
							trackColor={{ false: colors.borderStrong, true: colors.primary }}
							thumbColor={colors.background}
						/>
					}
					last
				/>
			</View>

			{/* Account */}
			<Text style={styles.sectionTitle}>{t("accountActions")}</Text>
			<View style={styles.group}>
				<Tile icon={Lock} title={t("changePassword")} pendingKey="password" onPress={() => go("password", () => router.push("/changepass"))} last />
			</View>

			<View style={styles.actions}>
				<PrimaryButton
					label={t("logout")}
					variant="danger"
					onPress={() => setLogoutOpen(true)}
					icon={<LogOut size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textOnDark} />}
				/>
				<PrimaryButton
					label={t("deleteAccount")}
					variant="ghost"
					textStyle={styles.destructiveText}
					onPress={() => {
						setPasswordInput("");
						setDeleteError(null);
						setDeleteOpen(true);
					}}
					icon={<Trash2 size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.danger} />}
				/>
			</View>

			{/* Log-out confirmation */}
			<AppBottomSheet visible={logoutOpen} onClose={() => setLogoutOpen(false)} scrollable={false}>
				<Text style={styles.sheetTitle}>{t("logoutTitle")}</Text>
				<Text style={styles.sheetBody}>{t("logoutBody")}</Text>
				<View style={styles.sheetActions}>
					<PrimaryButton label={t("logout")} variant="danger" onPress={handleLogout} />
					<PrimaryButton label={t("cancel")} variant="secondary" onPress={() => setLogoutOpen(false)} />
				</View>
			</AppBottomSheet>

			{/* Delete-account confirmation (password) */}
			<AppBottomSheet visible={deleteOpen} onClose={() => setDeleteOpen(false)}>
				<Text style={styles.sheetTitle}>{t("deleteAccount")}</Text>
				<Text style={styles.sheetBody}>{t("deleteAccountBody")}</Text>
				<FormField
					label={t("enterYourPassword")}
					value={passwordInput}
					onChangeText={setPasswordInput}
					secureTextEntry
					autoCapitalize="none"
					error={deleteError}
				/>
				<View style={styles.sheetActions}>
					<PrimaryButton label={t("deleteAccount")} variant="danger" loading={deleting} onPress={handleDeleteAccount} />
					<PrimaryButton label={t("cancel")} variant="secondary" onPress={() => setDeleteOpen(false)} />
				</View>
			</AppBottomSheet>

			{/* Full-screen "working" loaders for the account actions. */}
			<LoadingOverlay visible={loggingOut} label={t("loggingOut")} />
			<LoadingOverlay visible={deleting} label={t("deletingAccount")} />
		</ScrollView>
	);
}

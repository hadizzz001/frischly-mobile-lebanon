import LoadingButton from "@/components/LoadingButton";
import { API_BASE_URL } from "@/constants/api";
import { useTranslation } from "@/contexts/TranslationContext";
import { removePushTokenFromServer } from "@/hooks/useNotifications";
import { rtlRow, rtlText } from "@/utils/rtl";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { styles } from "@/styles/app/(tabs)/acc.styles";
import {
	Alert,
	Modal,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export default function AccScreen() {
	const { t, isRTL } = useTranslation();
	const [user, setUser] = useState<any>(null);
	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");

	const [deleting, setDeleting] = useState<boolean>(false);

	const handleDeleteAccount = async () => {
		if (deleting) return;
		setDeleting(true);
		try {
			const userData = await AsyncStorage.getItem("userData");
			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;

			const res = await fetch(
				`${API_BASE_URL}/auth/delete-account`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ password: passwordInput }),
				}
			);

			if (res.ok) {
				Alert.alert(t("accountDeleted"), t("accountRemoved"));
				await AsyncStorage.removeItem("userData");
				router.replace("/start");
			} else {
				const errorData = await res.json();
				Alert.alert(
					t("errorTitle"),
					errorData.message || t("failedDeleteAccount")
				);
			}
		} catch (err) {
			console.error(err);
			Alert.alert(t("errorTitle"), t("somethingWrong"));
		} finally {
			setDeleting(false);
		}
	};

	// Re-fetch user data every time the screen comes into focus
	useFocusEffect(
		useCallback(() => {
			const checkLogin = async () => {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				if (!userData && !guest) {
					router.replace("/start");
				} else {
					try {
						const parsedUser = userData ? JSON.parse(userData) : null;
						const token = parsedUser?.token;

						if (!token) {
							console.error("⚠️ No token found in userData");
							return;
						}

						const res = await fetch(
							`${API_BASE_URL}/auth/me`,
							{
								headers: {
									Authorization: `Bearer ${token}`,
									"Content-Type": "application/json",
								},
							}
						);

						if (res.ok) {
							const data = await res.json();
							setUser(data.data.user);
						} else {
							console.error("❌ Failed to fetch user:", res.status);
						}
					} catch (err) {
						console.error("🔥 Network/Fetch error:", err);
					}
				}
			};
			checkLogin();
		}, [router])
	);

	return (
		<ScrollView
			style={styles.container}
			showsVerticalScrollIndicator={true}
			contentContainerStyle={styles.scrollContent}
		>
			{/* Header Section */}
			<View style={styles.header}>
				<View style={styles.avatarContainer}>
					<View style={styles.avatar}>
						<Feather name="user" size={40} color="#f4bb26" />
					</View>
				</View>
				<Text style={[styles.title, rtlText(isRTL)]}>{t("myProfile")}</Text>
				<Text style={[styles.subtitle, rtlText(isRTL)]}>
					{user ? t("manageAccount") : t("welcome")}
				</Text>
			</View>

			{/* User Info Card */}
			{user ? (
				<View style={styles.infoCard}>
					<Text style={[styles.cardTitle, rtlText(isRTL)]}>{t("accountInfo")}</Text>

					{/* Basic Information Section */}
					<View style={[styles.infoRow, rtlRow(isRTL)]}>
						<View style={styles.iconContainer}>
							<Feather name="user" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("fullName")}</Text>
							<Text style={[styles.infoValue, rtlText(isRTL)]}>{user.name}</Text>
						</View>
					</View>

					<View style={[styles.infoRow, rtlRow(isRTL)]}>
						<View style={styles.iconContainer}>
							<Feather name="mail" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("email")}</Text>
							<Text style={[styles.infoValue, rtlText(isRTL)]}>{user.email}</Text>
						</View>
					</View>

					<View style={[styles.infoRow, rtlRow(isRTL)]}>
						<View style={styles.iconContainer}>
							<Feather name="phone" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("phoneNumber")}</Text>
							<Text style={[styles.infoValue, rtlText(isRTL)]}>{user.phoneNumber}</Text>
						</View>
					</View>

					{/* Address Section */}
					<View style={styles.addressSection}>
						<Text style={[styles.sectionTitle, rtlText(isRTL)]}>{t("address")}</Text>

						<View style={[styles.infoRow, rtlRow(isRTL)]}>
							<View style={styles.iconContainer}>
								<Feather name="map-pin" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("street")}</Text>
								<Text style={[styles.infoValue, rtlText(isRTL)]}>
									{user.address?.street || t("notProvided")}
								</Text>
							</View>
						</View>

						<View style={[styles.infoRow, rtlRow(isRTL)]}>
							<View style={styles.iconContainer}>
								<Feather name="map" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("city")}</Text>
								<Text style={[styles.infoValue, rtlText(isRTL)]}>
									{user.address?.city || t("notProvided")}
								</Text>
							</View>
						</View>

						<View style={[styles.infoRow, rtlRow(isRTL)]}>
							<View style={styles.iconContainer}>
								<Feather name="navigation" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("state")}</Text>
								<Text style={[styles.infoValue, rtlText(isRTL)]}>
									{user.address?.state || t("notProvided")}
								</Text>
							</View>
						</View>

						<View style={[styles.infoRow, rtlRow(isRTL)]}>
							<View style={styles.iconContainer}>
								<Feather name="globe" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={[styles.infoLabel, rtlText(isRTL)]}>{t("country")}</Text>
								<Text style={[styles.infoValue, rtlText(isRTL)]}>
									{t("lebanon")}
								</Text>
							</View>
						</View>
					</View>
				</View>
			) : (
				<View style={styles.guestCard}>
					<Feather name="user-x" size={48} color="#f4bb26" />
					<Text style={styles.guestText}>{t("browsingAsGuest")}</Text>
					<Text style={styles.guestSubtext}>{t("signInToAccess")}</Text>
				</View>
			)}

			{/* Action Buttons */}
			<View style={styles.actionsContainer}>
				{user && (
					<>
						{/* Row with Edit & Change Password */}
						<View
							style={styles.rowSpaceBetween}
						>
							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.loginButton,
									styles.flex1MarginRight,
								]}
								onPress={() => router.push("/edit-profile")}
							>
								<Feather
									name="edit"
									size={20}
									color="#000"
									style={styles.buttonIcon}
								/>
								<Text style={styles.actionButtonText}>{t("editProfile")}</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.loginButton,
									styles.flex1MarginLeft,
								]}
								onPress={() => router.push("/changepass")}
							>
								<Feather
									name="lock"
									size={20}
									color="#000"
									style={styles.buttonIcon}
								/>
								<Text style={styles.actionButtonText}>
									{t("changePassword")}
								</Text>
							</TouchableOpacity>
						</View>
					</>
				)}

				{user && (
					<TouchableOpacity
						style={[styles.actionButton, styles.loginButton]} // Same as login/logout
						onPress={() => router.push("/order")}
					>
						<Feather
							name="eye"
							size={20}
							color="#000"
							style={styles.buttonIcon}
						/>
						<Text style={styles.actionButtonText}>{t("viewOrders")}</Text>
					</TouchableOpacity>
				)}

				{/* Logout / Login Button */}
				<TouchableOpacity
					style={[
						styles.actionButton,
						user ? styles.logoutButton : styles.loginButton,
					]}
					onPress={async () => {
						if (user) {
							try {
								const raw = await AsyncStorage.getItem("userData");
								const token = raw ? JSON.parse(raw)?.token : null;
								await removePushTokenFromServer(token);
							} catch (e) {
								console.error(e);
							}
						}
						await AsyncStorage.removeItem("userData");
						router.replace("/start");
					}}
				>
					<Feather
						name={user ? "log-out" : "log-in"}
						size={20}
						color="#000"
						style={styles.buttonIcon}
					/>
					<Text style={[styles.actionButtonText, styles.logoutText]}>
						{user ? t("logout") : t("loginHere")}
					</Text>
				</TouchableOpacity>

				{user && (
					<TouchableOpacity
						style={[styles.actionButton, styles.deleteButton]}
						onPress={() => setShowDeleteModal(true)}
					>
						<Feather
							name="trash-2"
							size={20}
							color="#fff"
							style={styles.buttonIcon}
						/>
						<Text style={[styles.actionButtonText, styles.deleteText]}>
							{t("deleteAccount")}
						</Text>
					</TouchableOpacity>
				)}

				{/* ✅ Password Confirmation Modal */}
				<Modal
					transparent={true}
					visible={showDeleteModal}
					animationType="fade"
					onRequestClose={() => setShowDeleteModal(false)}
				>
					<View
						style={styles.modalOverlay}
					>
						<View
							style={styles.modalBox}
						>
							<Text
								style={[styles.modalTitle, rtlText(isRTL)]}
							>
								{t("confirmNewPassword")}
							</Text>
							<TextInput
								placeholder={t("enterYourPassword")}
								secureTextEntry
								value={passwordInput}
								onChangeText={setPasswordInput}
								style={[styles.modalInput, rtlText(isRTL)]}
							/>
							<View
								style={styles.modalButtonRow}
							>
								<TouchableOpacity
									style={[
										styles.actionButton,
										styles.modalCancelButton,
									]}
									onPress={() => setShowDeleteModal(false)}
								>
									<Text style={styles.blackBoldText}>
										{t("cancel")}
									</Text>
								</TouchableOpacity>

								<LoadingButton
									style={[
										styles.actionButton,
										styles.modalDeleteButton,
									]}
									onPress={handleDeleteAccount}
								>
									<Text style={styles.whiteBoldText}>
										{t("deleteAccount")}
									</Text>
								</LoadingButton>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</ScrollView>
	);
}

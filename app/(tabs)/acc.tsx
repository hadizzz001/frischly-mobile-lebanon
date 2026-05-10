import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AccScreen() {
	const { t } = useTranslation();
	const [user, setUser] = useState<any>(null);
	const router = useRouter();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [passwordInput, setPasswordInput] = useState("");

	const handleDeleteAccount = async () => {
		try {
			const userData = await AsyncStorage.getItem("userData");
			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;

			const res = await fetch(
				"https://frischly-dash-leb.onrender.com/api/auth/delete-account",
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
							"https://frischly-dash-leb.onrender.com/api/auth/me",
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
			contentContainerStyle={{
				paddingBottom: 160,
				flexGrow: 1,
			}}
		>
			{/* Header Section */}
			<View style={styles.header}>
				<View style={styles.avatarContainer}>
					<View style={styles.avatar}>
						<Feather name="user" size={40} color="#f4bb26" />
					</View>
				</View>
				<Text style={styles.title}>{t("myProfile")}</Text>
				<Text style={styles.subtitle}>
					{user ? t("manageAccount") : t("welcome")}
				</Text>
			</View>

			{/* User Info Card */}
			{user ? (
				<View style={styles.infoCard}>
					<Text style={styles.cardTitle}>{t("accountInfo")}</Text>

					{/* Basic Information Section */}
					<View style={styles.infoRow}>
						<View style={styles.iconContainer}>
							<Feather name="user" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={styles.infoLabel}>{t("name")}</Text>
							<Text style={styles.infoValue}>{user.name}</Text>
						</View>
					</View>

					<View style={styles.infoRow}>
						<View style={styles.iconContainer}>
							<Feather name="mail" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={styles.infoLabel}>{t("fullName")}</Text>
							<Text style={styles.infoValue}>{user.email}</Text>
						</View>
					</View>

					<View style={styles.infoRow}>
						<View style={styles.iconContainer}>
							<Feather name="phone" size={20} color="#f4bb26" />
						</View>
						<View style={styles.infoContent}>
							<Text style={styles.infoLabel}>{t("phoneNumber")}</Text>
							<Text style={styles.infoValue}>{user.phoneNumber}</Text>
						</View>
					</View>

					{/* Address Section */}
					<View style={styles.addressSection}>
						<Text style={styles.sectionTitle}>{t("address")}</Text>

						<View style={styles.infoRow}>
							<View style={styles.iconContainer}>
								<Feather name="map-pin" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("street")}</Text>
								<Text style={styles.infoValue}>
									{user.address?.street || "Not provided"}
								</Text>
							</View>
						</View>

						<View style={styles.infoRow}>
							<View style={styles.iconContainer}>
								<Feather name="map" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("city")}</Text>
								<Text style={styles.infoValue}>
									{user.address?.city || "Not provided"}
								</Text>
							</View>
						</View>

						<View style={styles.infoRow}>
							<View style={styles.iconContainer}>
								<Feather name="navigation" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("state")}</Text>
								<Text style={styles.infoValue}>
									{user.address?.state || "Not provided"}
								</Text>
							</View>
						</View>

						<View style={styles.infoRow}>
							<View style={styles.iconContainer}>
								<Feather name="globe" size={20} color="#f4bb26" />
							</View>
							<View style={styles.infoContent}>
								<Text style={styles.infoLabel}>{t("country")}</Text>
								<Text style={styles.infoValue}>
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
							style={{ flexDirection: "row", justifyContent: "space-between" }}
						>
							<TouchableOpacity
								style={[
									styles.actionButton,
									styles.loginButton,
									{ flex: 1, marginRight: 4 },
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
									{ flex: 1, marginLeft: 4 },
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
						style={{
							flex: 1,
							justifyContent: "center",
							alignItems: "center",
							backgroundColor: "rgba(0,0,0,0.5)",
						}}
					>
						<View
							style={{
								backgroundColor: "#fff",
								padding: 20,
								borderRadius: 12,
								width: "80%",
								alignItems: "center",
							}}
						>
							<Text
								style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}
							>
								{t("confirmNewPassword")}
							</Text>
							<TextInput
								placeholder="Enter your password"
								secureTextEntry
								value={passwordInput}
								onChangeText={setPasswordInput}
								style={{
									borderWidth: 1,
									borderColor: "#ccc",
									borderRadius: 8,
									padding: 10,
									width: "100%",
									marginBottom: 15,
								}}
							/>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-between",
									width: "100%",
								}}
							>
								<TouchableOpacity
									style={[
										styles.actionButton,
										{ flex: 1, backgroundColor: "#ccc", marginRight: 5 },
									]}
									onPress={() => setShowDeleteModal(false)}
								>
									<Text style={{ color: "#000", fontWeight: "bold" }}>
										{t("cancel")}
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.actionButton,
										{ flex: 1, backgroundColor: "#FF4444", marginLeft: 5 },
									]}
									onPress={handleDeleteAccount}
								>
									<Text style={{ color: "#fff", fontWeight: "bold" }}>
										{t("deleteAccount")}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	header: {
		alignItems: "center",
		paddingVertical: 20, // reduced from 40
		paddingHorizontal: 20,
	},
	avatarContainer: {
		marginBottom: 16,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#000000",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#000000",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#666666",
		textAlign: "center",
	},
	infoCard: {
		backgroundColor: "#FFFFFF",
		margin: 20,
		borderRadius: 16,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#F0F0F0",
	},
	guestCard: {
		backgroundColor: "#FFFFFF",
		margin: 20,
		borderRadius: 16,
		padding: 40,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#F0F0F0",
	},
	guestText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000000",
		marginTop: 16,
		textAlign: "center",
	},
	guestSubtext: {
		fontSize: 14,
		color: "#666666",
		marginTop: 8,
		textAlign: "center",
	},
	cardTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#000000",
		marginBottom: 20,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#FFF8E1",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	infoContent: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 12,
		color: "#666666",
		textTransform: "uppercase",
		fontWeight: "600",
		letterSpacing: 0.5,
		textAlign: "center",
	},
	infoValue: {
		fontSize: 16,
		color: "#000000",
		fontWeight: "500",
		marginTop: 2,
		textAlign: "center",
	},
	addressSection: {
		marginTop: 20,
		paddingTop: 20,
		borderTopWidth: 1,
		borderTopColor: "#E0E0E0",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#f4bb26",
		textAlign: "center",
		marginBottom: 16,
		letterSpacing: 1,
	},
	actionsContainer: {
		paddingHorizontal: 20,
		paddingBottom: 200, // extra space for safe scroll
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	loginButton: {
		backgroundColor: "#f4bb26",
	},
	logoutButton: {
		backgroundColor: "#f4bb26",
	},
	deleteButton: {
		backgroundColor: "#FF4444",
	},
	buttonIcon: {
		marginRight: 8,
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	loginText: {
		color: "#000000",
	},
	logoutText: {
		color: "#000000",
	},
	deleteText: {
		color: "#FFFFFF",
	},
	viewOrdersButton: {
		backgroundColor: "#f4bb26", // example yellow or keep same style as others
	},

	viewOrdersText: {
		color: "#000",
	},

	rowActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},

	actionButtonSmall: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 10,
		flex: 1,
		marginHorizontal: 4,
		backgroundColor: "#f4bb26",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},

	actionButtonTextSmall: {
		fontSize: 14,
		fontWeight: "600",
	},
});

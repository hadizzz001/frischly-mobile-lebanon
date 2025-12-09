import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Linking,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

export default function CheckoutSuccessPage() {
	const { t } = useTranslation();

	const { clearCart } = useCart();
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	const params = useLocalSearchParams();
	const parsed = JSON.parse(params.yourData);
	const paymentUrl = parsed.paymentUrl;

	console.log("Payment URL:", paymentUrl);

	useEffect(() => {
		const checkLoginAndFetchOrders = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				if (!userData && !guest) return;

				const parsedUser = userData ? JSON.parse(userData) : null;
				const token = parsedUser?.token;
				if (!token) return;

				// Fetch orders
				const ordersRes = await fetch(
					"https://frischlyshop-server.onrender.com/api/orders",
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);

				if (ordersRes.ok) {
					const ordersData = await ordersRes.json();
					const fetchedOrders = ordersData.data || [];
				} else {
					console.error("Failed to fetch orders");
				}
			} catch (err) {
				console.error("Error:", err);
			} finally {
				setLoading(false);
			}
		};

		checkLoginAndFetchOrders();
	}, []);

	useEffect(() => {
		clearCart();
	}, []);

	if (loading) return <Text>{t("loading")}</Text>;

	console.log("paymentUrl ", paymentUrl);

	return (
		<ScrollView
			style={styles.scrollContainer}
			contentContainerStyle={styles.contentContainer}
		>
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#000000" />
			</TouchableOpacity>

			<View style={styles.inner}>
				{/* SVG Icon */}
				<Svg
					width={64}
					height={64}
					viewBox="0 0 24 24"
					fill="none"
					stroke="#000"
				>
					<G strokeWidth={0}></G>
					<G strokeLinecap="round" strokeLinejoin="round"></G>
					<G>
						<Path
							d="M3.74181 20.5545C4.94143 22 7.17414 22 11.6395 22H12.3607C16.8261 22 19.0589 22 20.2585 20.5545M3.74181 20.5545C2.54219 19.1091 2.95365 16.9146 3.77657 12.5257C4.36179 9.40452 4.65441 7.84393 5.7653 6.92196M3.74181 20.5545C3.74181 20.5545 3.74181 20.5545 3.74181 20.5545ZM20.2585 20.5545C21.4581 19.1091 21.0466 16.9146 20.2237 12.5257C19.6385 9.40452 19.3459 7.84393 18.235 6.92196M20.2585 20.5545C20.2585 20.5545 20.2585 20.5545 20.2585 20.5545ZM18.235 6.92196C17.1241 6 15.5363 6 12.3607 6H11.6395C8.46398 6 6.8762 6 5.7653 6.92196M18.235 6.92196C18.235 6.92196 18.235 6.92196 18.235 6.92196ZM5.7653 6.92196C5.7653 6.92196 5.7653 6.92196 5.7653 6.92196Z"
							stroke="#000"
							strokeWidth={1.5}
						/>
						<Path
							d="M9 6V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V6"
							stroke="#000"
							strokeWidth={1.5}
							strokeLinecap="round"
						/>
					</G>
				</Svg>

				{/* Messages */}
				<Text style={styles.title}>{t("thankYouPurchase")}</Text>
				<Text style={styles.subtitle}>{t("orderProcessed")}</Text>

				{paymentUrl && (
					<TouchableOpacity
						style={styles.button}
						onPress={() => Linking.openURL(`${paymentUrl}`)}
					>
						<Text style={styles.buttonText}>{t("proceedToPayment")}</Text>
					</TouchableOpacity>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollContainer: { flex: 1, backgroundColor: "#FFFFFF" },
	contentContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		paddingBottom: 100,
	},
	inner: { alignItems: "center" },
	title: {
		fontSize: 22,
		fontWeight: "bold",
		marginTop: 20,
		color: "#000",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginTop: 10,
		marginBottom: 20,
		color: "#000000",
		textAlign: "center",
	},
	button: {
		backgroundColor: "#ffc300",
		borderRadius: 5,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 20,
		width: "100%",
		shadowOpacity: 0.3,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 4,
		elevation: 5,
	},
	buttonText: {
		color: "#000",
		fontWeight: "700",
		fontSize: 16,
		textTransform: "uppercase",
		letterSpacing: 2,
	},
	backButton: { position: "absolute", top: 40, left: 20, zIndex: 10 },
});

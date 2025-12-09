"use client";
import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
// -------------------- CheckoutPage Component --------------------
const CheckoutPage = ({ items, customer, setShowModal, modalResponse }) => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const { t } = useTranslation();

	// -------------------- Check user or guest --------------------
	useEffect(() => {
		const checkUser = async () => {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) {
				router.replace("/start");
			}
		};

		checkUser();
	}, []);

	useEffect(() => {
		if (modalResponse === "yes") {
			console.log("✅ Parent confirmed age -> continue order");
			processOrder();
		}
	}, [modalResponse]);

	// -------------------- Place Order --------------------
	// Main trigger: checks 18+ first
	const handlePlaceOrder = () => {
		console.log("🛒 handlePlaceOrder triggered");

		if (!items || !customer) {
			console.log("⚠️ Missing items or customer:", { items, customer });
			return;
		}

		// -------------------- 18+ Check --------------------
		const has18PlusItem = items.some((item) => item?.is18Plus === true);

		console.log("🔞 18+ check:", has18PlusItem);

		if (has18PlusItem) {
			console.log("🔞 18+ item found -> showing modal");
			setShowModal(true); // show modal on parent
			return; // STOP here for now
		}

		// If no 18+ items, continue immediately
		processOrder();
	};

	const processOrder = async () => {
		try {
			setLoading(true);
			console.log("⏳ Starting order process...");

			const stored = await AsyncStorage.getItem("userData");
			if (!stored) return;

			const { token } = JSON.parse(stored);

			const validItems = items.filter((item) => item && item._id);
			const orderItems = validItems.map((item) => ({
				product: item._id,
				quantity: item.quantity,
			}));

			const orderPayload = {
				customer: { id: customer._id },
				items: orderItems,
				paymentMethod: "card",
				notes: "Order placed from mobile app",
			};

			const orderRes = await fetch(
				"https://frischlyshop-server.onrender.com/api/orders",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(orderPayload),
				}
			);

			const data = await orderRes.json();

			if (!orderRes.ok || !data.success) {
				Alert.alert(t("errorTitle"), data.message || t("failedCreateOrder"));
				return;
			}

			router.push({
				pathname: "/done",
				params: { yourData: JSON.stringify(data) },
			});
		} catch (err) {
			Alert.alert(t("errorTitle"), err.message || t("errorOccurred"));
		} finally {
			setLoading(false);
		}
	};

	// -------------------- Render --------------------
	return (
		<ScrollView style={styles.container}>
			{/* Place Order Button */}
			<View style={{ marginTop: 20, marginBottom: 40 }}>
				<TouchableOpacity
					style={styles.button}
					onPress={handlePlaceOrder}
					disabled={loading}
				>
					{loading ? (
						<ActivityIndicator color="#000" />
					) : (
						<Text style={styles.buttonText}>{t("placeOrder")}</Text>
					)}
				</TouchableOpacity>
			</View>
		</ScrollView>
	);
};

// -------------------- Styles --------------------
const styles = StyleSheet.create({
	container: { padding: 20, backgroundColor: "#fff" },
	title: { fontSize: 20, marginBottom: 15, fontWeight: "bold" },
	button: {
		backgroundColor: "#ffc300",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default CheckoutPage;

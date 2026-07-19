"use client";
import { OrderService } from "@/services/api";
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
import type { CartItem, User } from "@/types";

interface AppliedPromo {
	promoCode: { id?: string; code?: string };
}

interface CheckoutPageProps {
	items: CartItem[];
	customer: User | null;
	setShowModal: (show: boolean) => void;
	modalResponse?: string | null;
	paymentMethod?: string;
	deliveryTime?: string;
	appliedPromo?: AppliedPromo | null;
	discountAmount?: number;
}

// -------------------- CheckoutPage Component --------------------
const CheckoutPage = ({
	items,
	customer,
	setShowModal,
	modalResponse,
	paymentMethod = "card",
	deliveryTime,
	appliedPromo,
	discountAmount,
}: CheckoutPageProps) => {
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(false);
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

			const validItems = items.filter((item) => item && item._id);
			const orderItems = validItems.map((item) => ({
				product: item._id,
				quantity: item.quantity,
			}));

			const orderPayload = {
				customer: { id: customer?._id },
				items: orderItems,
				paymentMethod: paymentMethod,
				notes: "Order placed from mobile app",
				deliveryTime,
				...(appliedPromo && {
					promoCode: appliedPromo.promoCode.id,
					discountAmount: discountAmount,
				}),
			};

			const data = await OrderService.create(orderPayload);

			router.push({
				pathname: "/done",
				params: { yourData: JSON.stringify(data) },
			});
		} catch (err) {
			Alert.alert(t("errorTitle"), (err as Error)?.message || t("errorOccurred"));
		} finally {
			setLoading(false);
		}
	};

	// -------------------- Render --------------------
	return (
		<ScrollView style={styles.container}>
			{/* Place Order Button */}
			<View style={styles.buttonWrap}>
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
	buttonWrap: { marginTop: 20, marginBottom: 40 },
	title: { fontSize: 20, marginBottom: 15, fontWeight: "bold" },
	button: {
		backgroundColor: "#f4bb26",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default CheckoutPage;

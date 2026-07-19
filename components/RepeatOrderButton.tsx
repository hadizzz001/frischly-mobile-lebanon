import { OrderService, ProductService } from "@/services/api";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import type { Order, OrderItem, Product } from "@/types";

const getProductId = (orderItem: OrderItem): string | undefined => {
	const product = orderItem?.product;
	return typeof product === "string" ? product : product?._id;
};

const getLatestOrder = (orders: Order[]): Order | undefined => {
	return [...orders].sort((a, b) => {
		const firstDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
		const secondDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
		return secondDate - firstDate;
	})[0];
};

export default function RepeatOrderButton() {
	const { t } = useTranslation();
	const { addItemsToCart, cart } = useCart();
	const [loading, setLoading] = useState<boolean>(false);
	// Only show this button for logged-in (non-guest) users who already have
	// at least one previous order.
	const [hasPreviousOrders, setHasPreviousOrders] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;

		const checkPreviousOrders = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");
				const token = userData ? JSON.parse(userData)?.token : null;
				const isGuest = guest === "true";

				// Guests or users without a token never see the button.
				if (!token || isGuest) {
					if (isMounted) setHasPreviousOrders(false);
					return;
				}

				const res = await OrderService.list();
				const orders = Array.isArray(res?.data) ? res.data : [];

				if (isMounted) setHasPreviousOrders(orders.length > 0);
			} catch {
				if (isMounted) setHasPreviousOrders(false);
			}
		};

		checkPreviousOrders();

		return () => {
			isMounted = false;
		};
	}, []);

	const fetchLatestOrder = async (): Promise<Order | undefined> => {
		const res = await OrderService.list();
		return getLatestOrder(res?.data || []);
	};

	const fetchCurrentProduct = async (
		productId: string,
	): Promise<Product | null> => {
		try {
			const res = await ProductService.getById(productId);
			return res?.data || null;
		} catch {
			return null;
		}
	};

	const handleRepeatOrder = async () => {
		if (loading) return;

		try {
			setLoading(true);

			const userData = await AsyncStorage.getItem("userData");
			const token = userData ? JSON.parse(userData)?.token : null;

			if (!token) {
				Alert.alert(t("errorTitle"), t("repeatOrderLoginRequired"));
				return;
			}

			const latestOrder = await fetchLatestOrder();
			const orderItems = latestOrder?.items || [];

			if (!latestOrder || orderItems.length === 0) {
				Alert.alert(t("errorTitle"), t("repeatOrderNoPrevious"));
				return;
			}

			let addedCount = 0;
			let skippedCount = 0;
			const repeatCartItems = [];

			for (const orderItem of orderItems) {
				const productId = getProductId(orderItem);

				if (!productId) {
					skippedCount += 1;
					continue;
				}

				const product = await fetchCurrentProduct(productId);
				const stock = Number(product?.stock || 0);

				if (!product || product.isActive === false || stock <= 0) {
					skippedCount += 1;
					continue;
				}

				const existingCartItem = cart.find(
					(cartItem) => String(cartItem._id) === String(product._id)
				);
				const existingQuantity = Number(existingCartItem?.quantity || 0);
				const requestedQuantity = Number(orderItem.quantity || 1);
				const quantity = Math.min(existingQuantity + requestedQuantity, stock);

				repeatCartItems.push({ ...product, quantity });
				addedCount += 1;
			}

			if (addedCount === 0) {
				Alert.alert(t("errorTitle"), t("repeatOrderNoAvailableItems"));
				return;
			}

			addItemsToCart(repeatCartItems);

			Alert.alert(
				t("success"),
				skippedCount > 0
					? t("repeatOrderAddedWithSkipped")
					: t("repeatOrderAdded")
			);
		} catch (error) {
			Alert.alert(t("errorTitle"), (error as Error)?.message || t("repeatOrderFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.wrapper} pointerEvents="box-none">
			{hasPreviousOrders && (
				<TouchableOpacity
					activeOpacity={0.85}
					disabled={loading}
					onPress={handleRepeatOrder}
					style={[styles.button, loading && styles.disabledButton]}
				>
					{loading ? (
						<ActivityIndicator color="#222222" />
					) : (
						<>
							<MaterialCommunityIcons name="cart" size={20} color="#f4bb26" />
							<Text style={styles.buttonText}>{t("repeatOrder")}</Text>
						</>
					)}
				</TouchableOpacity>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: 16,
		bottom: "5%",
		zIndex: 10,
		alignItems: "flex-start",
	},
	button: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#ffffff",
		borderRadius: 30,
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderWidth: 1,
		borderColor: "#eeeeee",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 6,
	},
	disabledButton: {
		opacity: 0.75,
	},
	buttonText: {
		color: "#222222",
		fontSize: 15,
		fontWeight: "700",
	},
});

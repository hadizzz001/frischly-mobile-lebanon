import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "https://frischly-dash-leb.onrender.com/api";

const getProductId = (orderItem) => {
	const product = orderItem?.product;
	return typeof product === "string" ? product : product?._id;
};

const getLatestOrder = (orders) => {
	return [...orders].sort((a, b) => {
		const firstDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
		const secondDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
		return secondDate - firstDate;
	})[0];
};

export default function RepeatOrderButton() {
	const { t } = useTranslation();
	const { addItemsToCart, cart } = useCart();
	const [loading, setLoading] = useState(false);

	const fetchLatestOrder = async (token) => {
		const response = await fetch(`${API_BASE_URL}/orders`, {
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data?.message || t("repeatOrderFailed"));
		}

		return getLatestOrder(data?.data || []);
	};

	const fetchCurrentProduct = async (productId) => {
		const response = await fetch(`${API_BASE_URL}/products/${productId}`);
		const data = await response.json();

		if (!response.ok || !data?.data) {
			return null;
		}

		return data.data;
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

			const latestOrder = await fetchLatestOrder(token);
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
			Alert.alert(t("errorTitle"), error.message || t("repeatOrderFailed"));
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.wrapper} pointerEvents="box-none">
			<TouchableOpacity
				activeOpacity={0.85}
				disabled={loading}
				onPress={handleRepeatOrder}
				style={[styles.button, loading && styles.disabledButton]}
			>
				{loading ? (
					<ActivityIndicator color="#000000" />
				) : (
					<Text style={styles.buttonText}>{t("repeatOrder")}</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: 16,
		right: 16,
		bottom: 42,
		zIndex: 10,
	},
	button: {
		backgroundColor: "#f4bb26",
		borderRadius: 14,
		paddingVertical: 14,
		alignItems: "center",
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
		color: "#000000",
		fontSize: 16,
		fontWeight: "700",
	},
});

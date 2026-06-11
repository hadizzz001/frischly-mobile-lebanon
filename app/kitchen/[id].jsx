import { getKitchenCartItems } from "@/components/KitchenSlider";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "https://frischly-dash-leb.onrender.com/api";

// Final (display) price = base price minus the discount percentage.
const getFinalPrice = (item) => {
	const basePrice = parseFloat(item.price) || 0;
	const discountPercent = parseFloat(item.discount) || 0;
	return basePrice - (basePrice * discountPercent) / 100;
};

export default function KitchenPage() {
	const { t, td } = useTranslation();
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const { addItemsToCart, cart } = useCart();

	const [kitchen, setKitchen] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchKitchen = async () => {
			try {
				setLoading(true);
				const res = await fetch(`${API_BASE_URL}/kitchens/public/${id}`);
				const json = await res.json();
				setKitchen(json?.data || null);
			} catch (err) {
				console.error("Kitchen fetch error:", err);
				setKitchen(null);
			} finally {
				setLoading(false);
			}
		};
		if (id) fetchKitchen();
	}, [id]);

	const handleAddAll = () => {
		const items = getKitchenCartItems(kitchen);

		if (!items.length) {
			Alert.alert(t("errorTitle"), t("kitchenNoItems"));
			return;
		}

		const totalActive = (kitchen.items || []).filter(
			(p) => p && p._id && p.isActive !== false,
		).length;
		const skipped = totalActive - items.length;

		const result = addItemsToCart(items);

		// On a different-market conflict, addItemsToCart shows its own restore
		// dialog, so only show success when items were actually added.
		if (result?.added) {
			Alert.alert(
				t("success"),
				skipped > 0 ? t("kitchenAddedWithSkipped") : t("kitchenAddedToCart"),
			);
		}
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	if (!kitchen) {
		return (
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
					<Feather name="chevron-left" size={24} color="#222" />
				</TouchableOpacity>
				<View style={styles.center}>
					<Text style={styles.emptyText}>{t("kitchenNotFound")}</Text>
				</View>
			</SafeAreaView>
		);
	}

	const items = kitchen.items || [];
	const addableItems = getKitchenCartItems(kitchen);
	const addableCount = addableItems.length;
	// Once any of this kitchen's items are in the cart, swap the "Add all"
	// button for a "Go to Checkout" button.
	const inCart = addableItems.some((it) =>
		cart.some((c) => c._id === it._id),
	);

	return (
		<View style={{ flex: 1, backgroundColor: "#fff" }}>
			<Stack.Screen options={{ headerTitle: "" }} />
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#222" />
			</TouchableOpacity>

			<ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
				{/* Main image */}
				<View style={styles.mainImageWrapper}>
					{kitchen.picture ? (
						<Image
							source={{ uri: kitchen.picture }}
							style={styles.mainImage}
							resizeMode="cover"
						/>
					) : (
						<Text style={styles.mainPlaceholder}>
							{(kitchen.name || "?").charAt(0).toUpperCase()}
						</Text>
					)}
				</View>

				<Text style={styles.title}>{td(kitchen.name)}</Text>

				{/* Under the main image: Add all to cart, or Go to Checkout once
				    the kitchen's items are in the cart. */}
				{inCart ? (
					<TouchableOpacity
						style={styles.checkoutBtn}
						activeOpacity={0.85}
						onPress={() => router.push("/checkout")}
					>
						<Feather name="credit-card" size={18} color="#fff" />
						<Text style={styles.addAllBtnText}>{t("goToCheckout")}</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity
						style={[styles.addAllBtn, addableCount === 0 && styles.addAllBtnDisabled]}
						activeOpacity={0.85}
						disabled={addableCount === 0}
						onPress={handleAddAll}
					>
						<Feather name="shopping-cart" size={18} color="#fff" />
						<Text style={styles.addAllBtnText}>{t("addAllToCart")}</Text>
					</TouchableOpacity>
				)}

				{/* Items (view only) */}
				<Text style={styles.sectionTitle}>{t("items")}</Text>

				{items.length === 0 ? (
					<Text style={styles.emptyText}>{t("kitchenNoItems")}</Text>
				) : (
					items.map((item) => {
						const basePrice = parseFloat(item.price) || 0;
						const finalPrice = getFinalPrice(item);
						const hasDiscount = finalPrice !== basePrice;
						const outOfStock = Number(item.stock || 0) <= 0;

						return (
							<View key={item._id} style={styles.itemRow}>
								<View style={styles.itemImageWrapper}>
									<Image
										source={{
											uri: item.picture || "https://via.placeholder.com/80",
										}}
										style={styles.itemImage}
										resizeMode="contain"
									/>
									{outOfStock && (
										<View style={styles.outOfStockOverlay}>
											<Text style={styles.outOfStockText}>{t("out")}</Text>
										</View>
									)}
								</View>

								<View style={styles.itemInfo}>
									<Text style={styles.itemName} numberOfLines={2}>
										{td(item.name)}
									</Text>

									<View style={styles.priceRow}>
										{hasDiscount && (
											<Text style={styles.basePrice}>
												${basePrice.toFixed(2)}
											</Text>
										)}
										<Text style={styles.finalPrice}>
											${finalPrice.toFixed(2)}
										</Text>
									</View>
								</View>

								{/* Quantity is view-only */}
								<View style={styles.qtyBox}>
									<Text style={styles.qtyLabel}>{t("quantity")}</Text>
									<Text style={styles.qtyValue}>1</Text>
								</View>
							</View>
						);
					})
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#fff" },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	backButton: {
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 4,
	},
	mainImageWrapper: {
		width: "100%",
		height: 220,
		backgroundColor: "#f7f7f7",
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	mainImage: { width: "100%", height: "100%" },
	mainPlaceholder: {
		fontSize: 64,
		fontWeight: "700",
		color: "#f4bb26",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#222",
		textAlign: "center",
		marginTop: 12,
		paddingHorizontal: 16,
	},
	addAllBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#f4bb26",
		borderRadius: 10,
		paddingVertical: 14,
		marginHorizontal: 16,
		marginTop: 14,
	},
	addAllBtnDisabled: {
		backgroundColor: "#cccccc",
	},
	checkoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#22a45d",
		borderRadius: 10,
		paddingVertical: 14,
		marginHorizontal: 16,
		marginTop: 14,
	},
	addAllBtnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#222",
		marginTop: 22,
		marginBottom: 8,
		paddingHorizontal: 16,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	itemImageWrapper: {
		width: 64,
		height: 64,
		borderRadius: 8,
		backgroundColor: "#f9f9f9",
		overflow: "hidden",
		justifyContent: "center",
		alignItems: "center",
	},
	itemImage: { width: "100%", height: "100%" },
	outOfStockOverlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0,0,0,0.45)",
		justifyContent: "center",
		alignItems: "center",
	},
	outOfStockText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 11,
	},
	itemInfo: {
		flex: 1,
		paddingHorizontal: 12,
	},
	itemName: {
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
	},
	priceRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginTop: 4,
	},
	basePrice: {
		fontSize: 13,
		color: "#999",
		textDecorationLine: "line-through",
	},
	finalPrice: {
		fontSize: 15,
		fontWeight: "700",
		color: "#f4bb26",
	},
	qtyBox: {
		alignItems: "center",
		minWidth: 54,
	},
	qtyLabel: {
		fontSize: 11,
		color: "#888",
	},
	qtyValue: {
		fontSize: 16,
		fontWeight: "700",
		color: "#222",
	},
	emptyText: {
		fontSize: 14,
		color: "#777",
		textAlign: "center",
		marginTop: 20,
		paddingHorizontal: 16,
	},
});

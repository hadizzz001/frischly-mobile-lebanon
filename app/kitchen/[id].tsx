import { getKitchenCartItems } from "@/components/KitchenSlider";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { KitchenService } from "@/services/api";
import { styles } from "@/styles/app/kitchen/[id].styles";
import type { Kitchen } from "@/types";
import { getFinalPrice } from "@/utils/product";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function KitchenPage() {
	const { t, td } = useTranslation();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { addItemsToCart, cart } = useCart();

	const [kitchen, setKitchen] = useState<Kitchen | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchKitchen = async () => {
			try {
				setLoading(true);
				const res = await KitchenService.getByIdPublic(id);
				setKitchen(res?.data || null);
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

		const totalActive = (kitchen?.items || []).filter(
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

	const items = [...(kitchen.items || [])].sort(
		(a, b) => (parseFloat(String(b?.price)) || 0) - (parseFloat(String(a?.price)) || 0),
	);
	const addableItems = getKitchenCartItems(kitchen);
	const addableCount = addableItems.length;
	// Once any of this kitchen's items are in the cart, swap the "Add all"
	// button for a "Go to Checkout" button.
	const inCart = addableItems.some((it) =>
		cart.some((c) => c._id === it._id),
	);

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerTitle: "" }} />
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#222" />
			</TouchableOpacity>

			<ScrollView contentContainerStyle={styles.scrollContent}>
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
						const basePrice = parseFloat(String(item.price)) || 0;
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

import BackButton from "@/components/ui/BackButton";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { useGoToCheckout } from "@/hooks/useGoToCheckout";
import { KitchenService } from "@/services/api";
import { styles } from "@/styles/app/kitchen/[id].styles";
import type { Kitchen, Product } from "@/types";
import { getKitchenCartItems, isKitchenInCart } from "@/utils/kitchen";
import { getBasePrice, getFinalPrice } from "@/utils/product";
import { rtlAlign, rtlRow } from "@/utils/rtl";
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
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { addItemsToCart, addToCart, removeFromCart, cart } = useCart();
	const { isBusy, anyBusy, run } = useBusyAction();
	const { goToCheckout, preparing: preparingCheckout } = useGoToCheckout();

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

	// Per-item add / +/- controls. The kitchen screen used to be view-only, so a
	// shopper could only take the whole kitchen; these mirror the product cards
	// on the home page (quantity read straight from the cart).
	const cartQuantity = (productId: string) =>
		cart.find((c) => String(c._id) === String(productId))?.quantity || 0;

	const increaseQty = (item: Product) => {
		const current = cartQuantity(item._id);
		const stock = Number(item.stock) || 0;
		if (stock > 0 && current >= stock) return;
		run(`${current > 0 ? "inc" : "add"}-${item._id}`, () => {
			addToCart(item, current + 1);
		});
	};

	const decreaseQty = (item: Product) => {
		const current = cartQuantity(item._id);
		run(`dec-${item._id}`, () => {
			if (current <= 1) removeFromCart(item._id);
			else addToCart(item, current - 1);
		});
	};

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

		run("add-all", () => {
			const result = addItemsToCart(items);

			// On a different-market conflict, addItemsToCart shows its own restore
			// dialog, so only show success when items were actually added.
			if (result?.added) {
				Alert.alert(
					t("success"),
					skipped > 0 ? t("kitchenAddedWithSkipped") : t("kitchenAddedToCart"),
				);
			}
		});
	};

	if (loading) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#F59E0B" />
			</View>
		);
	}

	if (!kitchen) {
		return (
			<SafeAreaView edges={[]} style={styles.safeArea}>
				<BackButton onPress={() => router.back()} style={[styles.backButton, rtlAlign(isRTL)]} />
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
	// Once this whole kitchen is in the cart, offer a shortcut to checkout.
	// Derived from the cart, so removing an item (or placing the order) hides it
	// again straight away — and a kitchen that only shares a product with one
	// that was added never counts as taken.
	const inCart = isKitchenInCart(kitchen, cart);

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerTitle: "" }} />
			<BackButton onPress={() => router.back()} style={[styles.backButton, rtlAlign(isRTL)]} />

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

				{/* Under the main image: "Add all to cart" stays available (items can
				    also be added one by one below), and "Go to Checkout" appears
				    alongside it only while this kitchen's items are in the cart. */}
				<TouchableOpacity
					style={[styles.addAllBtn, rtlRow(isRTL), addableCount === 0 && styles.addAllBtnDisabled]}
					activeOpacity={0.85}
					disabled={addableCount === 0 || anyBusy}
					onPress={handleAddAll}
				>
					{isBusy("add-all") ? (
						<ActivityIndicator size="small" color="#111827" />
					) : (
						<>
							<Feather name="shopping-cart" size={18} color="#111827" />
							<Text style={styles.addAllBtnText}>{t("addAllToCart")}</Text>
						</>
					)}
				</TouchableOpacity>

				{inCart && (
					<TouchableOpacity
						style={[styles.checkoutBtn, rtlRow(isRTL)]}
						activeOpacity={0.85}
						disabled={preparingCheckout}
						onPress={() => goToCheckout()}
					>
						{preparingCheckout ? (
							<ActivityIndicator size="small" color="#111827" />
						) : (
							<>
								<Feather name="credit-card" size={18} color="#111827" />
								<Text style={styles.addAllBtnText}>{t("goToCheckout")}</Text>
							</>
						)}
					</TouchableOpacity>
				)}

				{/* Items (view only) */}
				<Text style={styles.sectionTitle}>{t("items")}</Text>

				{items.length === 0 ? (
					<Text style={styles.emptyText}>{t("kitchenNoItems")}</Text>
				) : (
					items.map((item) => {
						const basePrice = getBasePrice(item);
						const finalPrice = getFinalPrice(item);
						const hasDiscount = finalPrice !== basePrice;
						const outOfStock = Number(item.stock || 0) <= 0;
						const quantity = cartQuantity(item._id);

						return (
							<View key={item._id} style={[styles.itemRow, rtlRow(isRTL)]}>
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

									<View style={[styles.priceRow, rtlRow(isRTL)]}>
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

								{/* Add this single item (or adjust its quantity). */}
								{!outOfStock && (
									<View style={styles.qtyBox}>
										{quantity > 0 ? (
											<>
												<TouchableOpacity
													onPress={() => decreaseQty(item)}
													disabled={anyBusy}
													style={styles.qtyBtn}
												>
													{isBusy(`dec-${item._id}`) ? (
														<ActivityIndicator size="small" color="#111827" />
													) : (
														<Text style={styles.qtyBtnText}>-</Text>
													)}
												</TouchableOpacity>
												<Text style={styles.qtyValue}>{quantity}</Text>
												<TouchableOpacity
													onPress={() => increaseQty(item)}
													disabled={
														quantity >= Number(item.stock || 0) || anyBusy
													}
													style={[
														styles.qtyBtn,
														quantity >= Number(item.stock || 0) &&
															styles.qtyBtnDisabled,
													]}
												>
													{isBusy(`inc-${item._id}`) ? (
														<ActivityIndicator size="small" color="#111827" />
													) : (
														<Text style={styles.qtyBtnText}>+</Text>
													)}
												</TouchableOpacity>
											</>
										) : (
											<TouchableOpacity
												onPress={() => increaseQty(item)}
												disabled={anyBusy}
												style={styles.addBtn}
											>
												{isBusy(`add-${item._id}`) ? (
													<ActivityIndicator size="small" color="#111827" />
												) : (
													<Feather
														name="shopping-cart"
														size={18}
														color="#111827"
													/>
												)}
											</TouchableOpacity>
										)}
									</View>
								)}
							</View>
						);
					})
				)}
			</ScrollView>
		</View>
	);
}

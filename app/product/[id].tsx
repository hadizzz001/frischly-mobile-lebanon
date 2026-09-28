import BackButton from "@/components/ui/BackButton";
import OutOfStockComponent from "@/components/OutOfStockComponent";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { ProductService } from "@/services/api";
import { styles } from "@/styles/app/product/[id].styles";
import type { Product } from "@/types";
import {
	DEFAULT_USD_TO_LBP_RATE,
	formatLbp,
	getUsdToLbpRate,
} from "@/utils/currency";
import { formatWeight, getBasePrice, getFinalPrice } from "@/utils/product";
import { tapLight, tapMedium } from "@/utils/haptics";
import { rtlText } from "@/utils/rtl";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

export default function ProductPage() {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const { cart, addToCart } = useCart();
	const { isBusy, anyBusy, run } = useBusyAction();

	const [product, setProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [zoomed, setZoomed] = useState(false);
	// Once this product (at the selected quantity) is in the cart the bottom
	// button turns into "Checkout"; changing the quantity turns it back into
	// "Add" so the new quantity can be applied.
	const [added, setAdded] = useState(false);
	// Shown next to the USD price; configured by the admin (Dashboard →
	// Settings → "USD to LBP Exchange Rate"), 90,000 until it loads.
	const [rate, setRate] = useState(DEFAULT_USD_TO_LBP_RATE);

	useEffect(() => {
		let cancelled = false;
		const fetchData = async () => {
			try {
				const res = await ProductService.getById(id as string);
				if (!cancelled && res?.success && res?.data) setProduct(res.data);
			} catch (err) {
				console.error("Product fetch error:", err);
			}
		};
		if (id) fetchData();
		return () => {
			cancelled = true;
		};
	}, [id]);

	useEffect(() => {
		let cancelled = false;
		getUsdToLbpRate()
			.then((value) => {
				if (!cancelled) setRate(value);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	// Start from whatever is already in the cart so the +/- picks up where the
	// shopper left off instead of resetting to 1.
	const cartQuantity =
		cart.find((c) => String(c._id) === String(id))?.quantity || 0;
	useEffect(() => {
		setQuantity(cartQuantity > 0 ? cartQuantity : 1);
	}, [cartQuantity]);

	if (!product) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#F59E0B" />
			</View>
		);
	}

	// Tax + bottle refund are part of both prices (see utils/product), so the
	// number here is the one the cart and checkout will use.
	const basePrice = getBasePrice(product);
	const discountPercent = Number(product.discount) || 0;
	const taxPercent = Number(product.tax) || 0;
	const bottleRefund = Number(product.bottlerefund) || 0;
	const finalPrice = getFinalPrice(product);
	const hasDiscount = discountPercent > 0 && finalPrice !== basePrice;
	const stock = Number(product.stock) || 0;
	const isOutOfStock = stock <= 0;
	const weight = formatWeight(product.weight);
	const lineTotal = finalPrice * quantity;

	// Once the item is in the cart the button stays "Checkout": changing the
	// quantity updates the cart line straight away instead of flipping the
	// button back to "Add".
	const showCheckout = added || cartQuantity > 0;

	const setQuantityTo = (next: number) => {
		setQuantity(next);
		if (showCheckout) addToCart(product, next);
	};

	const decrease = () => {
		tapLight();
		run("dec", () => setQuantityTo(Math.max(1, quantity - 1)));
	};

	const increase = () => {
		tapLight();
		run("inc", () =>
			setQuantityTo(stock > 0 ? Math.min(stock, quantity + 1) : quantity + 1),
		);
	};

	const handleAdd = () =>
		run("add", () => {
			tapMedium();
			const result = addToCart(product, quantity);
			// A different-market add shows its own restore dialog and lands in the
			// cart only after it is confirmed — the cart check above picks that up.
			if (result?.added) setAdded(true);
		});

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerTitle: "" }} />

			<BackButton onPress={() => router.back()} style={styles.backButton} />

			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
			>
				{/* Image on top */}
				<TouchableOpacity activeOpacity={0.9} onPress={() => setZoomed(true)}>
					<View style={styles.imageBox}>
						<Image
							source={{
								uri: product.picture || "https://via.placeholder.com/300",
							}}
							style={styles.image}
							resizeMode="contain"
						/>
					</View>
				</TouchableOpacity>

				<View style={styles.info}>
					{/* Small red discount box */}
					{discountPercent > 0 && (
						<View style={styles.discountBadge}>
							<Text style={styles.discountBadgeText}>
								{discountPercent}% {t("off")}
							</Text>
						</View>
					)}

					{/* Title */}
					<Text style={[styles.title, rtlText(isRTL)]}>{td(product.name)}</Text>

					{/* Weight */}
					{!!weight && (
						<Text style={[styles.weight, rtlText(isRTL)]}>{weight}</Text>
					)}

					{/* Other values (tax, bottle refund, ...) */}
					{taxPercent > 0 && (
						<Text style={[styles.meta, rtlText(isRTL)]}>
							{t("tax")}: {taxPercent}%
						</Text>
					)}
					{bottleRefund > 0 && (
						<Text style={[styles.meta, rtlText(isRTL)]}>
							{t("bottle")}: ${bottleRefund.toFixed(2)}
						</Text>
					)}

					{!!product.description && (
						<Text style={[styles.description, rtlText(isRTL)]}>
							{product.description}
						</Text>
					)}

					{/* Price on one row: LBP (regular) + USD (thin, same size),
					    then the old price — LBP and USD both struck through. */}
					<View style={styles.priceRow}>
						<Text
							style={[
								styles.priceLbp,
								!hasDiscount && styles.priceNoDiscount,
							]}
						>
							{formatLbp(finalPrice, rate)}
						</Text>
						<Text
							style={[
								styles.priceUsd,
								!hasDiscount && styles.priceNoDiscount,
							]}
						>
							${finalPrice.toFixed(2)}
						</Text>
						{hasDiscount && (
							<>
								<Text style={styles.oldPrice}>
									{formatLbp(basePrice, rate)}
								</Text>
								<Text style={styles.oldPrice}>${basePrice.toFixed(2)}</Text>
							</>
						)}
					</View>

					{isOutOfStock && <OutOfStockComponent itemName={product.name} />}
				</View>
			</ScrollView>

			{/* Fixed bottom bar: quantity on the left, add + price on the right.
			    It sits inside the screen, i.e. above the app-wide bottom nav,
			    which already handles the safe-area inset. */}
			<View style={styles.bottomBar}>
				<View style={styles.bottomBarInner}>
					<View style={styles.qtyBox}>
						<TouchableOpacity
							onPress={decrease}
							disabled={quantity <= 1 || anyBusy}
							style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
						>
							{isBusy("dec") ? (
								<ActivityIndicator size="small" color="#111" />
							) : (
								<Text style={styles.qtyBtnText}>-</Text>
							)}
						</TouchableOpacity>
						<Text style={styles.qtyValue}>{quantity}</Text>
						<TouchableOpacity
							onPress={increase}
							disabled={isOutOfStock || quantity >= stock || anyBusy}
							style={[
								styles.qtyBtn,
								(isOutOfStock || quantity >= stock) && styles.qtyBtnDisabled,
							]}
						>
							{isBusy("inc") ? (
								<ActivityIndicator size="small" color="#111" />
							) : (
								<Text style={styles.qtyBtnText}>+</Text>
							)}
						</TouchableOpacity>
					</View>

					<TouchableOpacity
						onPress={showCheckout ? () => router.push("/checkout") : handleAdd}
						disabled={isOutOfStock || anyBusy}
						activeOpacity={0.85}
						style={[styles.addBtn, isOutOfStock && styles.addBtnDisabled]}
					>
						{isBusy("add") ? (
							<ActivityIndicator size="small" color="#111827" />
						) : (
							<Text style={styles.addBtnText} numberOfLines={1}>
								{isOutOfStock
									? t("out")
									: showCheckout
										? t("checkout")
										: t("add")}
							</Text>
						)}
						{!isOutOfStock && (
							<View style={styles.addBtnPrices}>
								<Text style={styles.addBtnPriceLbp} numberOfLines={1}>
									{formatLbp(lineTotal, rate)}
								</Text>
								<Text style={styles.addBtnPriceUsd} numberOfLines={1}>
									${lineTotal.toFixed(2)}
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>
			</View>

			{/* Image zoom */}
			<Modal
				visible={zoomed}
				transparent
				animationType="fade"
				onRequestClose={() => setZoomed(false)}
			>
				<TouchableOpacity
					style={styles.zoomOverlay}
					activeOpacity={1}
					onPress={() => setZoomed(false)}
				>
					<Image
						source={{ uri: product.picture || undefined }}
						style={styles.zoomImage}
						resizeMode="contain"
					/>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}

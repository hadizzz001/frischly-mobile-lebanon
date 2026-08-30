import { PRODUCT_SLIDE_ITEM_WIDTH as ITEM_WIDTH } from "@/constants/layout";
import { useCart } from "@/contexts/CartContext";
import { ProductService } from "@/services/api";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { getUserCityAndPin } from "@/utils/userCity";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/ProductSlide.styles";
import type { CartItem, Product } from "@/types";
import type { DiscountCarouselProps } from "@/types/components/ProductSlide.types";
import { rtlRow } from "@/utils/rtl";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

export default function DiscountCarousel({
	refreshTrigger,
	marketId,
}: DiscountCarouselProps) {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const flatListRef = useRef<FlatList<Product>>(null);
	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const { addToCart, removeFromCart, cart } = useCart();
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [showQty, setShowQty] = useState<Record<string, boolean>>({}); // Track which products show qty

	// Keep the +/- quantity UI in sync with the actual cart (also reflects a
	// cart "restore" when switching markets).
	useEffect(() => {
		const nextQuantities: Record<string, number> = {};
		const nextShowQty: Record<string, boolean> = {};
		cart.forEach((cartItem: CartItem) => {
			nextQuantities[cartItem._id] = cartItem.quantity || 1;
			nextShowQty[cartItem._id] = true;
		});
		setQuantities(nextQuantities);
		setShowQty(nextShowQty);
	}, [cart]);

	const fetchDiscountProducts = async () => {
		try {
			setLoading(true);

			// Market mode: show THIS market's discounted items. Markets have their
			// own city filtering (applied when the market list was loaded), so the
			// admin city gate below does not apply here.
			if (marketId) {
				const res = await ProductService.getDiscounted({
					market: marketId,
					sortBy: "price",
					sortOrder: "desc",
				});
				const withDiscount = Array.isArray(res.data) ? res.data : [];
				const sorted = [...withDiscount].sort(
					(a, b) =>
						(parseFloat(String(b?.price)) || 0) -
						(parseFloat(String(a?.price)) || 0)
				);
				setDiscountedProducts(sorted.slice(0, 12));
				return;
			}

			// Main-store (admin) items are only shown to users in a city the admin
			// serves AND whose exact map pin falls inside the admin's configured
			// delivery-range circle(s), when set (same rule already enforced for
			// markets). Guests (no city/pin) and an unconfigured admin still see
			// everything.
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setDiscountedProducts([]);
				return;
			}

			// Hot sale shows main-store discounted items only (no market products).
			// Default sort: highest price first.
			const res = await ProductService.getDiscounted({
				market: "none",
				sortBy: "price",
				sortOrder: "desc",
			});
			const withDiscount = Array.isArray(res.data) ? res.data : [];
			// Client-side sort as a safety net in case the API ignores the sort params.
			const sorted = [...withDiscount].sort(
				(a, b) =>
					(parseFloat(String(b?.price)) || 0) -
					(parseFloat(String(a?.price)) || 0)
			);
			setDiscountedProducts(sorted.slice(0, 12));
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDiscountProducts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) {
			fetchDiscountProducts();
		}
	}, [refreshTrigger]);

const increaseQty = (product: Product) => {
  const currentQty = quantities[product._id] || 0;

  // ✅ Check stock before increase
  if (currentQty >= product.stock) {
    return; // Do nothing if max stock reached
  }

  const newQty = currentQty + 1;
  // Adding from a different market shows a confirm dialog and is applied
  // asynchronously, so only reflect the change locally when it was added.
  const result = addToCart(product, newQty);
  if (result?.added) {
    setQuantities({ ...quantities, [product._id]: newQty });
    setShowQty({ ...showQty, [product._id]: true });
  }
};


	const decreaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;
		if (currentQty <= 1) {
			// Remove from cart and hide qty
			const updatedQuantities = { ...quantities };
			delete updatedQuantities[product._id];
			setQuantities(updatedQuantities);
			removeFromCart(product._id);
			setShowQty({ ...showQty, [product._id]: false });
		} else {
			const newQty = currentQty - 1;
			setQuantities({ ...quantities, [product._id]: newQty });
			addToCart(product, newQty);
		}
	};

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#f4bb26" />
				<Text>{t("loading")}</Text>
			</View>
		);
	}

	// No discounted items for the user's city (e.g. the admin doesn't serve it)
	// -> hide the whole "Hot Sale" section instead of showing an empty header.
	if (!discountedProducts.length) {
		return null;
	}

	const renderProduct = (product: Product) => {
const basePrice = product.price || 0;
const discountPercent = product.discount || 0;

const finalPrice =
	discountPercent > 0
		? basePrice - (basePrice * discountPercent) / 100
		: basePrice;

// const finalPrice = basePrice;


		const isQtyVisible = showQty[product._id] || false;

		return (
			<TouchableOpacity
				key={product._id}
				onPress={() => router.push(`/product/${product._id}`)}
				activeOpacity={0.8}
				style={styles.card}
			>
				<View style={styles.imageWrapper}>
					<Image
						source={{
							uri: product.picture || "https://via.placeholder.com/150",
						}}
						style={styles.image}
						resizeMode="contain"
					/>
					{product.stock === 0 && (
						<View style={styles.overlay}>
							<Text style={styles.outOfStockText}>{t("out")}</Text>
						</View>
					)}
					{discountPercent > 0 && (
						<View style={styles.discountBadge}>
							<Text style={styles.discountText}>-{discountPercent}%</Text>
						</View>
					)}
				</View>

				<Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
					{td(product.name)}
				</Text>
 
<View style={styles.priceRow}>
  <Text style={styles.basePrice}>${basePrice.toFixed(2)}</Text>
  <Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>
</View>


{/* Quantity Selector or Add to Cart (Hidden if Out of Stock) */}
{product.stock > 0 && (
  <View style={styles.qtyRow}>
    {isQtyVisible ? (
      <>
        <TouchableOpacity onPress={() => decreaseQty(product)} style={styles.qtyBtn}>
          <Text style={styles.qtyText}>-</Text>
        </TouchableOpacity>
<Text style={styles.qtyValue}>{quantities[product._id]}</Text>

<TouchableOpacity
  onPress={() => increaseQty(product)}
  style={[
    styles.qtyBtn,
    quantities[product._id] >= product.stock && { opacity: 0.3 }, // visual disabled
  ]}
  disabled={quantities[product._id] >= product.stock} // ✅ disables the button
>
  <Text style={styles.qtyText}>+</Text>
</TouchableOpacity>

      </>
    ) : (
      <TouchableOpacity
        onPress={() => increaseQty(product)}
        style={[styles.qtyBtn, styles.qtyBtnCartPadding]}
      >
        <Feather name="shopping-cart" size={20} color="#fff" />
      </TouchableOpacity>
    )}
  </View>
)}

			</TouchableOpacity>
		);
	};

	// "See all" opens the discounted listing — scoped to this market when in
	// market mode, otherwise the main-store discount page.
	const seeAllHref = marketId
		? `/shop?market=${marketId}&discount=true`
		: "/shop?discount=true";

	return (
		<View style={styles.wrapper}>
			<View style={[styles.header, rtlRow(isRTL)]}>
				<Text style={styles.headerText}>{t("hotSale")}</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push(seeAllHref)}
					>
						<Text style={styles.allText}>{t("all")}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push(seeAllHref)}>
						<Feather name="chevron-right" size={24} color="#000000" />
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				ref={flatListRef}
				data={discountedProducts}
				horizontal
				showsHorizontalScrollIndicator={false}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => renderProduct(item)}
				onScroll={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
					setCurrentIndex(index);
				}}
				scrollEventThrottle={16}
			/>
		</View>
	);
}

import { useRouter } from "expo-router";
import { Minus, Plus, ShoppingCart } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import CatalogImage from "@/components/ui/CatalogImage";
import {
	PRODUCT_CARD_COMPACT_MAX_WIDTH,
	PRODUCT_CARD_NAME_MAX_CHARS,
	PRODUCT_GRID_ITEM_WIDTH,
} from "@/constants/layout";
import { colors, icon } from "@/constants/theme";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { useUsdToLbpRate } from "@/hooks/useUsdToLbpRate";
import { compactStyles as cs, styles } from "@/styles/components/ProductCard.styles";
import type { ProductCardProps } from "@/types/components/ProductCard.types";
import { PRODUCT_TILE_TRANSFORMATION } from "@/utils/cloudinary";
import { formatLbp, formatUsd } from "@/utils/currency";
import { rtlRow } from "@/utils/rtl";
import { tapLight, tapMedium } from "@/utils/haptics";
import {
	formatWeight,
	getBasePrice,
	getFinalPrice,
	truncateName,
} from "@/utils/product";

// THE product card used by every listing in the app (home grid, hot-sale
// carousel, shop, search results, category pages) — but NOT the product detail
// page, which has its own bigger layout. Top to bottom:
//   image (framed + centred, see CatalogImage) -> name (2 lines) -> weight ->
//   price in LBP -> USD -> old price struck through (sale items only) ->
//   add-to-cart / stepper.
//
// The quantity is read straight from the cart, so a card always mirrors what
// is actually in the cart no matter which screen it is rendered on.
export default function ProductCard({
	product,
	width,
	imageHeight,
	onPress,
	showCartControls = true,
	style,
}: ProductCardProps) {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const { cart, addToCart, removeFromCart } = useCart();
	const rate = useUsdToLbpRate();
	const { isBusy, anyBusy, run } = useBusyAction();

	// Both prices carry the item's tax + bottle refund, so what the card shows
	// is what the cart will charge.
	const basePrice = getBasePrice(product);
	const discountPercent = Number(product.discount) || 0;
	const finalPrice = getFinalPrice(product);
	const hasDiscount = discountPercent > 0 && finalPrice !== basePrice;
	const stock = Number(product.stock) || 0;
	const outOfStock = stock === 0;
	const weight = formatWeight(product.weight);

	// Narrow cards (3 per row) use the compact layout; `c(key)` picks its
	// override for a style key, or nothing on a regular card.
	const compact = (width ?? PRODUCT_GRID_ITEM_WIDTH) < PRODUCT_CARD_COMPACT_MAX_WIDTH;
	const c = <K extends keyof typeof cs>(key: K) => (compact ? cs[key] : null);
	const smallIcon = compact ? 14 : icon.sizeSmall;

	const cartItem = cart.find((item) => String(item._id) === String(product._id));
	const quantity = cartItem?.quantity || 0;

	// Each control shows a spinner in place of its icon while the cart updates.
	const increaseQty = () => {
		if (stock > 0 && quantity >= stock) return;
		if (quantity > 0) tapLight();
		else tapMedium();
		run(quantity > 0 ? "inc" : "add", () => {
			addToCart(product, quantity + 1);
		});
	};

	const decreaseQty = () => {
		tapLight();
		run("dec", () => {
			if (quantity <= 1) removeFromCart(product._id);
			else addToCart(product, quantity - 1);
		});
	};

	return (
		<View style={[styles.card, c("card"), width ? { width } : null, style]}>
			<Pressable
				onPress={onPress ?? (() => router.push(`/product/${product._id}`))}
				style={({ pressed }) => [styles.body, pressed && { opacity: 0.85 }]}
				accessibilityRole="button"
			>
				{/* Image — framed so the product sits in the middle of the tile
				    whatever its canvas; cached, never re-laid-out on load. */}
				<View
					style={[
						styles.imageWrapper,
						c("imageWrapper"),
						imageHeight ? { height: imageHeight, aspectRatio: undefined } : null,
					]}
				>
					<CatalogImage
						uri={product.picture}
						transformation={PRODUCT_TILE_TRANSFORMATION}
						style={[styles.image, outOfStock && styles.imageOutOfStock]}
						contentFit="contain"
						cachePolicy="memory-disk"
						transition={150}
						recyclingKey={product._id}
					/>
					{outOfStock && (
						<View style={[styles.outOfStockBadge, c("outOfStockBadge")]}>
							<Text style={[styles.outOfStockText, c("outOfStockText")]} numberOfLines={1}>
								{t("out")}
							</Text>
						</View>
					)}
					{discountPercent > 0 && (
						<View
							style={[
								styles.discountBadge,
								c("discountBadge"),
								isRTL
									? compact ? cs.discountBadgeRight : styles.discountBadgeRight
									: compact ? cs.discountBadgeLeft : styles.discountBadgeLeft,
							]}
						>
							<Text style={[styles.discountText, c("discountText")]}>
								{compact ? `-${discountPercent}%` : `-${discountPercent}% ${t("off")}`}
							</Text>
						</View>
					)}
				</View>

				<Text style={[styles.name, c("name")]} numberOfLines={2}>
					{truncateName(td(product.name), PRODUCT_CARD_NAME_MAX_CHARS)}
				</Text>

				{!!weight && <Text style={[styles.weight, c("weight")]}>{weight}</Text>}

				{/* At most three short price lines: the selling price in LBP
				    (dominant), its USD equivalent (beside it, or on its own line in
				    the compact card), and on sale items the old LBP price struck
				    through. The "-x%" badge on the image already tells the saving,
				    so there is no savings line and no second currency on the old
				    price — together they crowded the small card. */}
				{compact ? (
					<>
						<Text
							style={[styles.price, cs.price]}
							numberOfLines={1}
							adjustsFontSizeToFit
							minimumFontScale={0.75}
						>
							{formatLbp(finalPrice, rate)}
						</Text>
						<Text style={cs.priceUsd} numberOfLines={1}>
							{formatUsd(finalPrice)}
						</Text>
					</>
				) : (
					<Text style={styles.price} numberOfLines={1}>
						{formatLbp(finalPrice, rate)}
						<Text style={styles.priceUsd}>{`  ${formatUsd(finalPrice)}`}</Text>
					</Text>
				)}

				{hasDiscount && (
					<Text
						style={[styles.oldPrice, c("oldPrice")]}
						numberOfLines={1}
						adjustsFontSizeToFit={compact}
						minimumFontScale={0.75}
					>
						{formatLbp(basePrice, rate)}
					</Text>
				)}
			</Pressable>

			{/* Add to cart / quantity stepper */}
			{showCartControls && !outOfStock && (
				quantity > 0 ? (
					<View style={[styles.qtyRow, c("qtyRow")]}>
						<Pressable
							onPress={decreaseQty}
							disabled={anyBusy}
							style={[styles.qtyBtn, c("qtyBtn")]}
							accessibilityRole="button"
							accessibilityLabel="-"
						>
							{isBusy("dec") ? (
								<ActivityIndicator size="small" color={colors.primaryText} />
							) : (
								<Minus size={smallIcon} strokeWidth={2.5} color={colors.primaryText} />
							)}
						</Pressable>
						<Text style={[styles.qtyValue, c("qtyValue")]}>{quantity}</Text>
						<Pressable
							onPress={increaseQty}
							disabled={quantity >= stock || anyBusy}
							style={[styles.qtyBtn, c("qtyBtn"), quantity >= stock && styles.qtyBtnDisabled]}
							accessibilityRole="button"
							accessibilityLabel="+"
						>
							{isBusy("inc") ? (
								<ActivityIndicator size="small" color={colors.primaryText} />
							) : (
								<Plus size={smallIcon} strokeWidth={2.5} color={colors.primaryText} />
							)}
						</Pressable>
					</View>
				) : (
					<Pressable
						onPress={increaseQty}
						disabled={anyBusy}
						style={({ pressed }) => [styles.addBtn, c("addBtn"), rtlRow(isRTL), pressed && { opacity: 0.85 }]}
						accessibilityRole="button"
					>
						{isBusy("add") ? (
							<ActivityIndicator size="small" color={colors.primaryText} />
						) : (
							<>
								<ShoppingCart size={smallIcon} strokeWidth={icon.strokeWidth} color={colors.primaryText} />
								<Text style={[styles.addBtnText, c("addBtnText")]} numberOfLines={1}>
									{t("add")}
								</Text>
							</>
						)}
					</Pressable>
				)
			)}
		</View>
	);
}

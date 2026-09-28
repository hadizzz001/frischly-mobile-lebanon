import { SECTION_TITLE_ICON_COLOR, SECTION_TITLE_ICON_SIZE } from "@/constants/navigation";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react-native";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { colors } from "@/constants/theme";
import { PRODUCT_SLIDE_ITEM_WIDTH as ITEM_WIDTH } from "@/constants/layout";
import { ProductService } from "@/services/api";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { getUserCityAndPin } from "@/utils/userCity";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/ProductSlide.styles";
import type { Product } from "@/types";
import type { DiscountCarouselProps } from "@/types/components/ProductSlide.types";
import { rtlRow } from "@/utils/rtl";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

export default function DiscountCarousel({
	refreshTrigger,
	marketId,
	onContent,
	hideLoader,
}: DiscountCarouselProps) {
	const { t, isRTL } = useTranslation();
	const router = useRouter();
	const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const flatListRef = useRef<FlatList<Product>>(null);
	const [currentIndex, setCurrentIndex] = useState<number>(0);

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

	// Tell the home screen whether this section ended up with content.
	useEffect(() => {
		if (!loading) onContent?.(discountedProducts.length > 0);
	}, [loading, discountedProducts, onContent]);

	if (loading) {
		if (hideLoader) return null;
		return (
			<View style={styles.loadingContainer}>
				<ProductGridSkeleton count={3} cardWidth={ITEM_WIDTH} horizontal />
			</View>
		);
	}

	// No discounted items for the user's city (e.g. the admin doesn't serve it)
	// -> hide the whole "Hot Sale" section instead of showing an empty header.
	if (!discountedProducts.length) {
		return null;
	}

	const renderProduct = (product: Product) => (
		<ProductCard key={product._id} product={product} width={ITEM_WIDTH} />
	);

	// "See all" opens the discounted listing — scoped to this market when in
	// market mode, otherwise the main-store discount page.
	const seeAllHref = marketId
		? `/shop?market=${marketId}&discount=true`
		: "/shop?discount=true";

	return (
		<View style={styles.wrapper}>
			<View style={[styles.header, rtlRow(isRTL)]}>
				<View style={[styles.headerTitleRow, rtlRow(isRTL)]}>
					<Text style={styles.headerText}>{t("hotSale")}</Text>
					<Flame
						size={SECTION_TITLE_ICON_SIZE}
						color={SECTION_TITLE_ICON_COLOR}
					/>
				</View>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push(seeAllHref as never)}
					>
						<Text style={styles.allText}>{t("all")}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push(seeAllHref as never)} hitSlop={8}>
						{isRTL ? (
							<ChevronLeft size={22} strokeWidth={2} color={colors.textSecondary} />
						) : (
							<ChevronRight size={22} strokeWidth={2} color={colors.textSecondary} />
						)}
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
				contentContainerStyle={styles.listContent}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				onScroll={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
					setCurrentIndex(index);
				}}
				scrollEventThrottle={16}
			/>
		</View>
	);
}

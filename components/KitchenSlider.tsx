import { SECTION_TITLE_ICON_COLOR, SECTION_TITLE_ICON_SIZE } from "@/constants/navigation";
import { ChefHat } from "lucide-react-native";
import { useTranslation } from "@/contexts/TranslationContext";
import { KitchenService } from "@/services/api";
import { styles } from "@/styles/components/KitchenSlider.styles";
import type { KitchenCategory } from "@/types";
import type { KitchenSliderProps } from "@/types/components/KitchenSlider.types";
import {
    deriveKitchenCategories,
    loadStoreKitchens,
    MAIN_STORE_SCOPE,
} from "@/utils/kitchen";
import { rtlRow } from "@/utils/rtl";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Kitchen CATEGORIES of a single store (e.g. Pizza, Pasta). Tapping one opens
// /kitchen-category/[id], which lists that store's kitchens inside it; tapping
// a kitchen there opens /kitchen/[id] with the kitchen's items.
//
// Which store: no `marketId` -> FreshlyLB's own kitchens (the home screen);
// with a `marketId` -> that market's own (the market screen). The scoping is
// done by the API, and only categories that actually hold a kitchen are shown,
// so a category can never open an empty page.
export default function KitchenSlider({
	refreshTrigger,
	marketId,
	onContent,
	hideLoader,
}: KitchenSliderProps) {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();

	const [categories, setCategories] = useState<KitchenCategory[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const fetchCategories = async () => {
		try {
			setLoading(true);

			const [kitchens, catRes] = await Promise.all([
				loadStoreKitchens(marketId),
				// This store's own category documents — they carry the card picture,
				// which the copy populated on a kitchen may not have.
				KitchenService.categoriesPublic({
					market: marketId ? String(marketId) : MAIN_STORE_SCOPE,
				}),
			]);

			const full = Array.isArray(catRes?.data) ? catRes.data : [];
			setCategories(deriveKitchenCategories(kitchens, full));
		} catch (err) {
			console.error("KitchenSlider fetch error:", err);
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) fetchCategories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger]);

	// Keep the shopper inside the same store when opening a category.
	const categoryHref = (category: KitchenCategory) => {
		const base = `/kitchen-category/${category._id}?name=${encodeURIComponent(
			typeof category.name === "string" ? category.name : "",
		)}`;
		return marketId
			? `${base}&marketId=${encodeURIComponent(String(marketId))}`
			: base;
	};

	// Tell the home screen whether this section ended up with content.
	useEffect(() => {
		if (!loading) onContent?.(categories.length > 0);
	}, [loading, categories, onContent]);

	if (loading) {
		if (hideLoader) return null;
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#F59E0B" />
			</View>
		);
	}

	// Nothing to show for this store (no kitchens, or the main store doesn't
	// serve the shopper) -> hide the whole section.
	if (!categories.length) return null;

	return (
		<View style={styles.container}>
			<View style={[styles.header, rtlRow(isRTL)]}>
				<View style={[styles.headerTitleRow, rtlRow(isRTL)]}>
					<Text style={styles.headerText}>{t("kitchens")}</Text>
					<ChefHat
						size={SECTION_TITLE_ICON_SIZE}
						color={SECTION_TITLE_ICON_COLOR}
					/>
				</View>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.track}
			>
				{categories.map((category) => (
					<TouchableOpacity
						key={category._id}
						style={styles.card}
						activeOpacity={0.85}
						onPress={() => router.push(categoryHref(category) as never)}
					>
						<View style={styles.imageWrapper}>
							{category.picture ? (
								<Image
									source={{ uri: category.picture }}
									style={styles.image}
									resizeMode="cover"
								/>
							) : (
								<Text style={styles.placeholder}>
									{(category.name || "?").charAt(0).toUpperCase()}
								</Text>
							)}
						</View>
						<Text style={styles.name} numberOfLines={1}>
							{td(category.name)}
						</Text>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);
}

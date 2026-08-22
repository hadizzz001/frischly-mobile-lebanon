import { useTranslation } from "@/contexts/TranslationContext";
import { CategoryService, MarketService } from "@/services/api";
import { styles } from "@/styles/components/CatSlider.styles";
import type { Category } from "@/types";
import type { CategoriesGridProps } from "@/types/components/CatSlider.types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 4 - 15; // 4 items per row
const ITEM_HEIGHT = 130;

export default function CategoriesGrid({
	refreshTrigger,
	marketId,
	marketName,
}: CategoriesGridProps) {
	const { t, td, isRTL } = useTranslation();

	const router = useRouter();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	const fetchCategories = async () => {
		try {
			setLoading(true);

			// Market mode: show the market's OWN categories. Markets have their own
			// city filtering, so the admin city gate below does not apply here.
			if (marketId) {
				const res = await MarketService.categories(marketId);
				setCategories(
					(Array.isArray(res?.data) ? res.data : []) as unknown as Category[],
				);
				return;
			}

			// Tapping a category opens the main-store (admin) products, so the
			// category list is only shown to users in a city the admin serves AND
			// whose exact map pin falls inside the admin's configured delivery-range
			// circle(s), when set (same rule already enforced for markets). Guests
			// (no city/pin) and an unconfigured admin still see everything.
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setCategories([]);
				return;
			}

			const res = await CategoryService.list(1000);
			setCategories(res.data || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) {
			fetchCategories();
		}
	}, [refreshTrigger]);

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color="#f4bb26" />
				<Text>{t("loadingCategories")}</Text>
			</View>
		);
	}

	// No categories for the user's city (e.g. the admin doesn't serve it) ->
	// hide the whole section instead of showing an empty "Shop by category".
	if (!categories.length) {
		return null;
	}

	const renderCategory = ({ item: category }: { item: Category }) => (
		<TouchableOpacity
			key={category._id}
			onPress={() => router.push(categoryHref(category))}
			activeOpacity={0.8}
			style={styles.card}
		>
			<View style={styles.imageWrapper}>
				{category.image ? (
					<Image
						source={{ uri: category.image }}
						style={styles.image}
						resizeMode="contain"
					/>
				) : (
					<Text style={styles.imagePlaceholder}>
						{(td(category.name) || "?").charAt(0).toUpperCase()}
					</Text>
				)}
			</View>
			<Text style={styles.name} numberOfLines={2}>
				{td(category.name)}
			</Text>
		</TouchableOpacity>
	);

	// Where the header "All" / chevron and each category card link to. In market
	// mode everything stays inside the market's shop; otherwise the main store.
	const shopAllHref = marketId
		? `/shop?market=${marketId}&marketName=${encodeURIComponent(marketName || "")}`
		: "/shop";
	const categoryHref = (category: Category) =>
		marketId
			? `/shop?market=${marketId}&marketName=${encodeURIComponent(
					marketName || "",
			  )}&marketCat=${encodeURIComponent(String(category._id))}`
			: `/shop1?category=${encodeURIComponent(category.name)}`;

	return (
		<View style={styles.sectionContainer}>
			<View style={[styles.header, rtlRow(isRTL)]}>
				<Text style={styles.headerText}>{t("shopByCategory")}</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push(shopAllHref)}
					>
						<Text style={styles.allText}>{t("all")}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push(shopAllHref)}>
						<Feather name="chevron-right" size={24} color="#777" />
					</TouchableOpacity>
				</View>
			</View>

			{/* Rendered as a plain wrapping View (not a FlatList) because this sits
			    inside the home screen's vertical ScrollView, where a nested vertical
			    FlatList triggers the "VirtualizedLists should never be nested"
			    warning. The category list is short, so this is fine. */}
			<View style={styles.gridContainer}>
				{categories.map((category) => renderCategory({ item: category }))}
			</View>
		</View>
	);
}

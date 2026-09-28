"use client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ViewToken } from "react-native";
import { ScrollView, SectionList, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import ProductCard from "@/components/ProductCard";
import RegionEmptyState from "@/components/RegionEmptyState";
import BackButton from "@/components/ui/BackButton";
import EmptyState from "@/components/ui/EmptyState";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { PRODUCT_GRID_COLUMNS, SHOP1_ITEM_WIDTH } from "@/constants/layout";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService, ProductService } from "@/services/api";
import { styles } from "@/styles/app/shop1.styles";
import type { Product, User } from "@/types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";

import type { ProductSection } from "@/types/app/shop1.types";

export default function ShopPage() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { category } = useLocalSearchParams<{ category?: string }>();
	const { t, td, isRTL } = useTranslation();

	const [, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [sections, setSections] = useState<ProductSection[]>([]);
	const [currentSectionTitle, setCurrentSectionTitle] = useState("");
	const [unservedCity, setUnservedCity] = useState<string | null>(null);

	// Fetch products by category
	const fetchProducts = async () => {
		try {
			setLoading(true);

			// Main-store (admin) items are only shown to users in a city the admin
			// serves AND whose exact map pin falls inside the admin's configured
			// delivery-range circle(s), when set. Guests (no city/pin) and an
			// unconfigured admin still see everything.
			setUnservedCity(null);
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setSections([]);
				setUnservedCity(city);
				return;
			}

			const json = await ProductService.list({
				limit: 200,
				sortBy: "price",
				sortOrder: "desc",
				market: "none",
				category: category as string,
			});
			if (json?.success && json?.data) {
				const grouped: Record<string, Product[]> = {};
				json.data.forEach((item) => {
				const sub =
					(typeof item?.subcategory === "object"
						? item.subcategory?.name
						: undefined) || t("other");
					if (!grouped[sub]) grouped[sub] = [];
					grouped[sub].push(item);
				});

				// Create sections data for SectionList with rows
				const sectionsData = Object.keys(grouped).map((subName) => {
					const products = grouped[subName];
					const rows: Product[][] = [];
					for (let i = 0; i < products.length; i += PRODUCT_GRID_COLUMNS) {
						rows.push(products.slice(i, i + PRODUCT_GRID_COLUMNS));
					}
					return {
						title: subName,
						data: rows,
						key: subName,
					};
				});
				setSections(sectionsData);
			}
		} catch (err) {
			console.error("fetchProducts error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (category) fetchProducts();
	}, [category]);

	// Check login
	useEffect(() => {
		const checkLogin = async () => {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) {
				router.replace("/start");
			} else {
				try {
					const res = await AuthService.me();
					if (res?.success) {
						const data = res.data as unknown as { user?: User } | User;
						setUser((data as { user?: User })?.user ?? (data as User));
					}
				} catch (err) {
					console.error("Network/Fetch error:", err);
				}
			}
		};
		checkLogin();
	}, []);

	const onViewableItemsChanged = ({
		viewableItems,
	}: {
		viewableItems: ViewToken[];
	}) => {
		if (viewableItems.length > 0) {
			const firstVisibleItem = viewableItems[0];
			// Find the section that contains this item
			const section = sections.find((sec) =>
				sec.data.some((row) =>
					row.some(
						(product) =>
							`row-${product._id || "unknown"}-${sec.data.indexOf(row)}` ===
							firstVisibleItem.key,
					),
				),
			);
			if (section) {
				setCurrentSectionTitle(section.title);
			}
		}
	};

	const renderProduct = (item: Product) => (
		<ProductCard key={item._id} product={item} width={SHOP1_ITEM_WIDTH} />
	);

	const header = (
		<View style={[styles.header, rtlRow(isRTL)]}>
			<BackButton />
			<Text style={styles.headerTitle} numberOfLines={1}>
				{td(category ?? "")}
			</Text>
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
				{header}
				<ScrollView contentContainerStyle={styles.skeletonWrap} scrollEnabled={false}>
					<ProductGridSkeleton count={6} />
				</ScrollView>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			{header}

			{/* Floating Sticky Header Alternative */}
			{currentSectionTitle ? (
				<View style={styles.floatingHeader}>
					<Text style={styles.floatingHeaderText}>{td(currentSectionTitle)}</Text>
				</View>
			) : null}

			{/* Grouped Products with SectionList */}
			<SectionList
				sections={sections}
				keyExtractor={(item, index) => {
					// item is a row (array of products), create key from first product ID and index
					return `row-${item[0]?._id || "unknown"}-${index}`;
				}}
				renderItem={({ item: row }) => (
					<View style={styles.row}>
						{row.map((product) => renderProduct(product))}
					</View>
				)}
				renderSectionHeader={({ section: { title } }) => (
					<Text style={styles.subcategoryTitle}>{td(title)}</Text>
				)}
				contentContainerStyle={[
					styles.listContentPadding,
					{ paddingBottom: Math.max(insets.bottom, 16) + 96 },
				]}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
				stickySectionHeadersEnabled={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={{
					itemVisiblePercentThreshold: 50,
				}}
				ListEmptyComponent={
					unservedCity !== null ? (
						<RegionEmptyState region={unservedCity} />
					) : (
						<EmptyState
							illustration="search"
							title={t("noProductsInCategory")}
							description={t("searchNoResultsBody")}
							actionLabel={t("browseCategories")}
							onAction={() => router.push("/menu")}
						/>
					)
				}
			/>
		</SafeAreaView>
	);
}

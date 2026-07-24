import { useTranslation } from "@/contexts/TranslationContext";
import { KitchenService } from "@/services/api";
import type { Kitchen, KitchenCategory, Product } from "@/types";
import {
    cityMatches,
    entityServesCity,
    getAdminCities,
} from "@/utils/cityVisibility";
import { getUserCity } from "@/utils/userCity";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2.4; // a bit wider than markets so the cards breathe

// Keep only items that can actually be ordered (active + in stock) and attach a
// default quantity of 1 each. Exported because the kitchen + kitchen-category
// screens reuse it to build their "add all to cart" payloads.
export const getKitchenCartItems = (
	kitchen?: { items?: Product[] } | null,
): (Product & { quantity: number })[] =>
	(kitchen?.items || [])
		.filter(
			(p) => p && p._id && p.isActive !== false && Number(p.stock || 0) > 0,
		)
		.map((p) => ({ ...p, quantity: 1 }));

// Apply the app-wide city visibility rule to a list of kitchens or kitchen
// categories. Both markets and the admin/main store can now serve MULTIPLE
// cities (an array), so:
//   - a market entry is shown only if its cities include the user's city,
//   - a main-store entry (no market) is shown only if the admin's serving
//     cities include the user's city.
// Guests (no city) and entries/admin with no city restriction see everything.
// Pass `adminCities` (from getAdminCities()) so main-store entries respect the
// admin's cities; omit it to keep main-store entries always visible.
// Exported so the kitchen-category screen reuses the same rule.
export const filterByCity = (
	list: KitchenCategory[],
	city?: string | null,
	adminCities: string[] = [],
): KitchenCategory[] =>
	city
		? (list || []).filter((entry) =>
				entry?.market
					? entityServesCity(entry.market, city)
					: cityMatches(adminCities, city),
		  )
		: list || [];

// The home screen shows kitchen CATEGORIES (e.g. Pizza, Pasta). Tapping a
// category opens /kitchen-category/[id], which lists the kitchens inside it;
// tapping a kitchen there opens /kitchen/[id] with that kitchen's items.
//
// When `marketId` is passed (used on a single market's home page), the
// component switches to a market-scoped mode instead: it shows that market's
// OWN kitchens directly (skipping the category grouping, since there's only
// one market to consider), and tapping a card opens /kitchen/[id] right away.
// If the market has no kitchens, nothing is rendered.
interface KitchenSliderProps {
	refreshTrigger?: number;
	marketId?: string;
}

export default function KitchenSlider({
	refreshTrigger,
	marketId,
}: KitchenSliderProps) {
	const { t, td } = useTranslation();
	const router = useRouter();

	const [categories, setCategories] = useState<KitchenCategory[]>([]);
	const [marketCategories, setMarketCategories] = useState<KitchenCategory[]>(
		[],
	);
	const [loading, setLoading] = useState<boolean>(true);

	// Read a kitchen's market id whether `market` is a plain id string or a
	// populated Market object.
	const kitchenMarketId = (k: Kitchen): string | null => {
		const m = (k as { market?: string | { _id?: string } | null }).market;
		if (!m) return null;
		return typeof m === "string" ? m : m._id || null;
	};

	// Market-scoped mode: same CATEGORY design as the admin home slider, but
	// only the categories that actually have at least one kitchen belonging to
	// this market. Derived from the market's own kitchens (each carries a
	// populated `category`), not the global kitchen-categories list.
	const fetchMarketCategories = async () => {
		try {
			setLoading(true);
			const res = await KitchenService.listPublic();
			const all = Array.isArray(res?.data) ? res.data : [];
			const mine = all.filter(
				(k) => k?.isActive !== false && kitchenMarketId(k) === String(marketId),
			);

			const seen = new Map<string, KitchenCategory>();
			for (const k of mine) {
				const cat = k.category;
				if (!cat || typeof cat !== "object") continue;
				if (!seen.has(cat._id)) seen.set(cat._id, cat);
			}
			setMarketCategories(Array.from(seen.values()));
		} catch (err) {
			console.error("KitchenSlider (market) fetch error:", err);
			setMarketCategories([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchCategories = async () => {
		try {
			setLoading(true);

			// Determine the logged-in user's city (guests have no city).
			// getUserCity() refreshes from /api/auth/me so stale logins still work.
			// Admin cities gate main-store (no-market) kitchen categories.
			const [city, adminCities] = await Promise.all([
				getUserCity(),
				getAdminCities(),
			]);

			const res = await KitchenService.categoriesPublic();
			const all = Array.isArray(res?.data) ? res.data : [];

			setCategories(filterByCity(all, city, adminCities));
		} catch (err) {
			console.error("KitchenSlider fetch error:", err);
			setCategories([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (marketId) fetchMarketCategories();
		else fetchCategories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) {
			if (marketId) fetchMarketCategories();
			else fetchCategories();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger]);

	if (loading) {
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#f4bb26" />
			</View>
		);
	}

	// Market-scoped mode: show this market's kitchen CATEGORIES (same card
	// design as the admin home slider). Renders nothing if the market has no
	// kitchens at all. Tapping a category opens the category page filtered to
	// this market only, via the `marketId` query param.
	if (marketId) {
		if (!marketCategories.length) return null;
		return (
			<View style={styles.container}>
				<View style={styles.header}>
					<Text style={styles.headerText}>{t("kitchens")}</Text>
				</View>

				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.track}
				>
					{marketCategories.map((category) => (
						<TouchableOpacity
							key={category._id}
							style={styles.card}
							activeOpacity={0.85}
							onPress={() =>
								router.push(
									`/kitchen-category/${category._id}?name=${encodeURIComponent(
										typeof category.name === "string" ? category.name : "",
									)}&marketId=${encodeURIComponent(String(marketId))}`,
								)
							}
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

	if (!categories.length) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{t("kitchens")}</Text>
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
						onPress={() =>
							router.push(
								`/kitchen-category/${category._id}?name=${encodeURIComponent(
									typeof category.name === "string" ? category.name : "",
								)}`,
							)
						}
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

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		marginTop: 8,
		paddingBottom: 10,
	},
	loaderBox: {
		height: 120,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000" },
	track: {
		paddingHorizontal: 8,
	},
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 5,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 8,
	},
	imageWrapper: {
		width: "100%",
		height: 110,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 34,
		fontWeight: "700",
		color: "#f4bb26",
	},
	name: {
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
		textAlign: "center",
		marginBottom: 4,
	},
});

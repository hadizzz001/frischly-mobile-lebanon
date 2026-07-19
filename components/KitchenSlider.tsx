import { KitchenService } from "@/services/api";
import { useTranslation } from "@/contexts/TranslationContext";
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
import type { KitchenCategory, Product } from "@/types";

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
interface KitchenSliderProps {
	refreshTrigger?: number;
}

export default function KitchenSlider({ refreshTrigger }: KitchenSliderProps) {
	const { t, td } = useTranslation();
	const router = useRouter();

	const [categories, setCategories] = useState<KitchenCategory[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

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
		fetchCategories();
	}, []);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) fetchCategories();
	}, [refreshTrigger]);

	if (loading) {
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#f4bb26" />
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

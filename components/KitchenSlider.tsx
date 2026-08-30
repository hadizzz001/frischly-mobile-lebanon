import { useTranslation } from "@/contexts/TranslationContext";
import { KitchenService } from "@/services/api";
import { styles } from "@/styles/components/KitchenSlider.styles";
import type { Kitchen, KitchenCategory, Product } from "@/types";
import type { KitchenSliderProps } from "@/types/components/KitchenSlider.types";
import {
    entityVisibleForCityOrPin,
    getAdminCities,
    getAdminDeliveryRegions,
    isVisibleForCityOrPin,
} from "@/utils/cityVisibility";
import { type DeliveryRegion } from "@/utils/geo";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
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

// Apply the app-wide visibility rule to a list of kitchens or kitchen
// categories. Both markets and the admin/main store can serve MULTIPLE cities
// (an array) and/or declare map-pin delivery circles, so an entry is shown when:
//   - the shopper's exact map pin falls inside its delivery circle(s), OR
//   - (no circles configured / no pin) its serving cities include the user's
//     city — for a market entry its own cities, for a main-store entry the
//     admin's cities.
// A pin inside the range always wins over a city mismatch.
// Guests (no city) and entries/admin with no city restriction see everything.
// Pass `adminCities` (from getAdminCities()) so main-store entries respect the
// admin's cities; omit it to keep main-store entries always visible.
// `pin` + `adminRegions` supply the admin's configured map-pin delivery-range
// circle(s) for main-store entries.
// Exported so the kitchen-category screen reuses the same rule.
export const filterByCity = (
	list: KitchenCategory[],
	city?: string | null,
	adminCities: string[] = [],
	pin?: { latitude: number; longitude: number } | null,
	adminRegions: DeliveryRegion[] = [],
): KitchenCategory[] =>
	(list || []).filter((entry) =>
		entry?.market
			? entityVisibleForCityOrPin(entry.market, city, pin)
			: isVisibleForCityOrPin(adminCities, adminRegions, city, pin),
	);

// The home screen shows kitchen CATEGORIES (e.g. Pizza, Pasta). Tapping a
// category opens /kitchen-category/[id], which lists the kitchens inside it;
// tapping a kitchen there opens /kitchen/[id] with that kitchen's items.
//
// When `marketId` is passed (used on a single market's home page), the
// component switches to a market-scoped mode instead: it shows that market's
// OWN kitchens directly (skipping the category grouping, since there's only
// one market to consider), and tapping a card opens /kitchen/[id] right away.
// If the market has no kitchens, nothing is rendered.
export default function KitchenSlider({
	refreshTrigger,
	marketId,
}: KitchenSliderProps) {
	const { t, td, isRTL } = useTranslation();
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

			// Determine the logged-in user's city + exact map pin (guests have
			// neither). getUserCityAndPin() refreshes from /api/auth/me so stale
			// logins still work. Admin cities + delivery-range pins gate main-store
			// (no-market) kitchen categories.
			const [{ city, pin }, adminCities, adminRegions] = await Promise.all([
				getUserCityAndPin(),
				getAdminCities(),
				getAdminDeliveryRegions(),
			]);

			const res = await KitchenService.categoriesPublic();
			const all = Array.isArray(res?.data) ? res.data : [];

			setCategories(filterByCity(all, city, adminCities, pin, adminRegions));
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
				<View style={[styles.header, rtlRow(isRTL)]}>
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
			<View style={[styles.header, rtlRow(isRTL)]}>
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

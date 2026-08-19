"use client";

import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import KitchenSlider from "@/components/KitchenSlider";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import RepeatOrderButton from "@/components/RepeatOrderButton";
import { globalStyles } from "@/constants/GlobalStyles";
import { useTranslation } from "@/contexts/TranslationContext";
import { MarketService } from "@/services/api";
import type { Market } from "@/types";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { styles } from "@/styles/app/market/[id].styles";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	TouchableOpacity,
	View,
} from "react-native";

// Market "home" page — mirrors the main (admin) home design, but every section
// is scoped to a single market: its Hot Sale carousel, its own categories and
// its product grid. Opened when a shopper taps a market on the home page.
export default function MarketHome() {
	const { t, td } = useTranslation();
	const router = useRouter();
	const { id, marketName } = useLocalSearchParams<{
		id: string;
		marketName?: string;
	}>();

	const [market, setMarket] = useState<Market | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	useEffect(() => {
		let cancelled = false;
		const fetchMarket = async () => {
			try {
				setLoading(true);
				// Customers aren't authorized to call the admin/market-only
				// GET /markets/:id endpoint, so read from the public markets list
				// instead (same source MarketsSlider uses, includes `logo`).
				const res = await MarketService.listPublic();
				const list = Array.isArray(res?.data) ? res.data : [];
				const found = list.find((m) => String(m._id) === String(id));
				if (!cancelled) setMarket(found || null);
			} catch (err) {
				console.error("Market fetch error:", err);
				if (!cancelled) setMarket(null);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		if (id) fetchMarket();
		return () => {
			cancelled = true;
		};
	}, [id]);

	const onRefresh = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	// Prefer the freshly fetched market name; fall back to the param passed by
	// the market slider so the header shows instantly while loading.
	const displayName = market ? td(market.name) : marketName || t("market");

	if (loading && !market) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerTitle: "" }} />

			<TouchableOpacity
				onPress={() => router.back()}
				style={styles.backButton}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<Feather name="chevron-left" size={24} color="#222" />
			</TouchableOpacity>

			<ScrollView
				style={globalStyles.flex1}
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				{/* Market-scoped sections (same components/design as the main home). */}
				{/* This market's own kitchens (if any) are shown above the Hot Sale
				    carousel; the component renders nothing if the market has none. */}
				<KitchenSlider refreshTrigger={refreshTrigger} marketId={id} />
				<ProductSlide refreshTrigger={refreshTrigger} marketId={id} />
				<CatSlider
					refreshTrigger={refreshTrigger}
					marketId={id}
					marketName={displayName}
				/>
				<ProductList
					refreshTrigger={refreshTrigger}
					setRefreshing={setRefreshing}
					marketId={id}
				/>
				<Footer />
			</ScrollView>

			<RepeatOrderButton />
		</View>
	);
}

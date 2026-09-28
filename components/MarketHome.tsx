import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";

import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import HomeSkeleton from "@/components/HomeSkeleton";
import KitchenSlider from "@/components/KitchenSlider";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import RepeatOrderButton from "@/components/RepeatOrderButton";
import BackButton from "@/components/ui/BackButton";
import EmptyState from "@/components/ui/EmptyState";
import { globalStyles } from "@/constants/GlobalStyles";
import { MARKET_SECTION_KEYS } from "@/constants/navigation";
import { useTranslation } from "@/contexts/TranslationContext";
import { MarketService } from "@/services/api";
import { styles } from "@/styles/components/MarketHome.styles";
import type { Market } from "@/types";
import type { MarketHomeProps } from "@/types/components/MarketHome.types";
import { rtlRow } from "@/utils/rtl";

/** Start loading the next page when the shopper is this close to the end. */
const LOAD_MORE_THRESHOLD_PX = 480;

// A market's home page: the SAME page structure as the main home screen
// (app/(tabs)/index.tsx) — Hot Sale carousel, then Shop by category, then the
// product grid with infinite scroll, one skeleton while the sections load —
// but every section is fed with THIS market's data (its discounted items, its
// own categories, its products). The market's kitchens, if it has any, sit
// above the Hot Sale row exactly where the home page shows kitchens.
//
// Rendered by the /market/[id] screen, and by the home tab itself when Freshly
// LB doesn't deliver to the shopper and this is the only market that does.
export default function MarketHome({
	marketId,
	marketName,
	market: initialMarket,
	showBack = true,
	onRefresh,
}: MarketHomeProps) {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();

	const [market, setMarket] = useState<Market | null>(initialMarket ?? null);
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// The name/logo in the top bar, unless the caller already passed the
	// market. Customers can't call the admin-only GET /markets/:id, so read
	// the public markets list (same source as MarketsSlider). The sections
	// don't wait for this — `marketName` shows until it lands.
	useEffect(() => {
		if (initialMarket && String(initialMarket._id) === String(marketId)) {
			setMarket(initialMarket);
			return;
		}
		let cancelled = false;
		MarketService.listPublic()
			.then((res) => {
				const list = Array.isArray(res?.data) ? res.data : [];
				const found = list.find((m) => String(m._id) === String(marketId));
				if (!cancelled) setMarket(found || null);
			})
			.catch((err) => console.error("Market fetch error:", err));
		return () => {
			cancelled = true;
		};
	}, [marketId, initialMarket]);

	// Each section reports whether it ended up with anything to render (same
	// mechanism as the home screen). Undefined = still loading.
	const [sections, setSections] = useState<Record<string, boolean>>({});

	const report = useCallback((key: string, hasContent: boolean) => {
		setSections((prev) =>
			prev[key] === hasContent ? prev : { ...prev, [key]: hasContent },
		);
	}, []);

	const onKitchens = useCallback((has: boolean) => report("kitchens", has), [report]);
	const onHotSale = useCallback((has: boolean) => report("hotSale", has), [report]);
	const onCategories = useCallback(
		(has: boolean) => report("categories", has),
		[report],
	);
	const onProducts = useCallback((has: boolean) => report("products", has), [report]);

	const isEmptyMarket = MARKET_SECTION_KEYS.every((key) => sections[key] === false);
	const isLoading = MARKET_SECTION_KEYS.some((key) => sections[key] === undefined);

	const reload = useCallback(() => {
		setSections({});
		setRefreshTrigger((prev) => prev + 1);
		onRefresh?.();
	}, [onRefresh]);

	// Infinite scroll for the product grid: bump a counter when the shopper
	// nears the end; the grid loads its next page.
	const [loadMoreSignal, setLoadMoreSignal] = useState(0);
	const lastSignalAt = useRef(0);
	const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
		const distanceFromEnd =
			contentSize.height - (contentOffset.y + layoutMeasurement.height);
		if (distanceFromEnd < LOAD_MORE_THRESHOLD_PX) {
			const now = Date.now();
			if (now - lastSignalAt.current > 600) {
				lastSignalAt.current = now;
				setLoadMoreSignal((n) => n + 1);
			}
		}
	}, []);

	// Prefer the loaded market name; fall back to the name the caller passed
	// so the bar has a title immediately.
	const displayName = market ? td(market.name) : marketName || t("market");

	const topBar = (
		<View style={[styles.topBar, rtlRow(isRTL)]}>
			{showBack && <BackButton onPress={() => router.back()} />}
			<View style={[styles.titleRow, rtlRow(isRTL)]}>
				{market?.logo ? (
					<Image
						source={{ uri: market.logo }}
						style={styles.logo}
						contentFit="contain"
						cachePolicy="memory-disk"
					/>
				) : (
					<View style={styles.logoFallback}>
						<Text style={styles.logoFallbackText}>
							{(displayName || "?").charAt(0).toUpperCase()}
						</Text>
					</View>
				)}
				<Text style={styles.title} numberOfLines={1}>
					{displayName}
				</Text>
			</View>
			{showBack && <View style={styles.topBarSpacer} />}
		</View>
	);

	// Nothing at all in this market -> the empty state IS the page.
	if (isEmptyMarket) {
		return (
			<View style={styles.root}>
				{topBar}
				<ScrollView
					style={globalStyles.flex1}
					contentContainerStyle={styles.emptyContent}
					refreshControl={
						<RefreshControl refreshing={false} onRefresh={reload} />
					}
				>
					<EmptyState
						title={t("marketEmptyTitle")}
						description={t("marketEmptyBody")}
						actionLabel={showBack ? t("backToHome") : undefined}
						onAction={showBack ? () => router.back() : undefined}
					/>
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={styles.root}>
			{topBar}
			<View style={globalStyles.flex1}>
				<ScrollView
					style={globalStyles.flex1}
					contentContainerStyle={styles.scrollContent}
					onScroll={onScroll}
					scrollEventThrottle={100}
					refreshControl={
						<RefreshControl refreshing={refreshing} onRefresh={reload} />
					}
				>
					<KitchenSlider
						refreshTrigger={refreshTrigger}
						marketId={marketId}
						onContent={onKitchens}
						hideLoader
					/>
					<ProductSlide
						refreshTrigger={refreshTrigger}
						marketId={marketId}
						onContent={onHotSale}
						hideLoader
					/>
					<CatSlider
						refreshTrigger={refreshTrigger}
						marketId={marketId}
						marketName={displayName}
						onContent={onCategories}
						hideLoader
					/>
					<ProductList
						refreshTrigger={refreshTrigger}
						setRefreshing={setRefreshing}
						marketId={marketId}
						onContent={onProducts}
						loadMoreSignal={loadMoreSignal}
						hideLoader
					/>
					<Footer />
				</ScrollView>
				{isLoading && <HomeSkeleton variant="market" />}
			</View>
			<RepeatOrderButton />
		</View>
	);
}

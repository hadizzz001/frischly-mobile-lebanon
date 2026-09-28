import { useCallback, useEffect, useRef, useState } from "react";
import {
	DeviceEventEmitter,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	RefreshControl,
	ScrollView,
	View,
} from "react-native";

import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import KitchenSlider from "@/components/KitchenSlider";
import HomeSkeleton from "@/components/HomeSkeleton";
import MarketHome from "@/components/MarketHome";
import MarketsSlider from "@/components/MarketsSlider";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import RegionEmptyState from "@/components/RegionEmptyState";
import RepeatOrderButton from "@/components/RepeatOrderButton";
import NewsTicker from "@/components/Textslide";
import { USER_CITY_CHANGED } from "@/constants/events";
import { globalStyles } from "@/constants/GlobalStyles";
import { HOME_SECTION_KEYS } from "@/constants/navigation";
import { styles } from "@/styles/app/(tabs)/index.styles";
import type { Market } from "@/types";
import { isServedByAdmin, refreshAdminCities } from "@/utils/cityVisibility";
import { setStoreAvailability } from "@/utils/storeAvailability";
import { getCachedAddress } from "@/utils/userAddress";
import { getUserCityAndPin } from "@/utils/userCity";
import { fetchVisibleMarkets } from "@/utils/visibleMarkets";

/** Start loading the next page when the shopper is this close to the end. */
const LOAD_MORE_THRESHOLD_PX = 480;

// What the home tab shows. "main" is the usual Freshly LB home. "market":
// Freshly LB doesn't deliver to the shopper and exactly one market does, so
// the main home would be nothing but that one market in a slider above empty
// sections — the home tab opens that market's own home page instead.
type HomeMode =
	| { kind: "deciding" }
	| { kind: "main" }
	| { kind: "market"; market: Market };

export default function HomeScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [city, setCity] = useState("");
	const [mode, setMode] = useState<HomeMode>({ kind: "deciding" });

	// Only the latest decision counts (a city change can start a new one while
	// the previous is still in flight).
	const decisionRef = useRef(0);
	const decideMode = useCallback(async () => {
		const run = ++decisionRef.current;
		let next: HomeMode = { kind: "main" };
		try {
			const { city: userCity, pin } = await getUserCityAndPin();
			// Served by Freshly LB (or a guest) -> the main home, no market lookup.
			if (!(await isServedByAdmin(userCity, pin))) {
				// Same list (and, within a few seconds, the same request) as the
				// markets slider on the main home.
				const markets = await fetchVisibleMarkets(userCity, pin);
				if (markets.length === 1) next = { kind: "market", market: markets[0] };
			}
		} catch (err) {
			// Can't tell -> the main home, which handles every case itself.
			console.error("Home mode check failed:", err);
		}
		if (run === decisionRef.current) setMode(next);
	}, []);

	useEffect(() => {
		decideMode();
	}, [decideMode]);

	// Each home section reports whether it ended up with anything to render.
	// When every one of them comes back empty there is nothing in this city, so
	// the whole page is replaced by the region empty state — no ticker, no
	// sliders, no grid, no footer. Undefined = that section hasn't finished
	// loading yet.
	const [sections, setSections] = useState<Record<string, boolean>>({});

	const report = useCallback((key: string, hasContent: boolean) => {
		setSections((prev) =>
			prev[key] === hasContent ? prev : { ...prev, [key]: hasContent },
		);
	}, []);

	const onMarkets = useCallback((has: boolean) => report("markets", has), [report]);
	const onKitchens = useCallback((has: boolean) => report("kitchens", has), [report]);
	const onHotSale = useCallback((has: boolean) => report("hotSale", has), [report]);
	const onCategories = useCallback(
		(has: boolean) => report("categories", has),
		[report],
	);
	const onProducts = useCallback((has: boolean) => report("products", has), [report]);

	// Coming back to the main home from the single-market home (e.g. Freshly LB
	// now delivers here): its sections mount fresh, so forget the answers they
	// gave last time and show the skeleton until they answer again.
	const prevModeKind = useRef(mode.kind);
	useEffect(() => {
		if (prevModeKind.current === "market" && mode.kind === "main") setSections({});
		prevModeKind.current = mode.kind;
	}, [mode.kind]);

	// Every section has answered, and every answer was "nothing".
	const isEmptyCity =
		mode.kind === "main" && HOME_SECTION_KEYS.every((key) => sections[key] === false);
	// Still waiting on at least one of them: the sections keep their own
	// spinners to themselves (hideLoader) and this screen shows a single one.
	// The main home's sections load while the store check runs (so shoppers
	// Freshly LB serves never wait on it), but stay under the skeleton until
	// it's clear the main home is what this shopper gets.
	const isLoading =
		mode.kind === "deciding" ||
		HOME_SECTION_KEYS.some((key) => sections[key] === undefined);

	// Publish the answer app-wide once every section has reported (a market
	// home means there is a store).
	useEffect(() => {
		if (mode.kind === "market") {
			setStoreAvailability(true);
		} else if (
			mode.kind === "main" &&
			HOME_SECTION_KEYS.every((key) => sections[key] !== undefined)
		) {
			setStoreAvailability(!isEmptyCity);
		}
	}, [mode.kind, sections, isEmptyCity]);

	useEffect(() => {
		getCachedAddress().then((a) => setCity(a?.city || "")).catch(() => {});
	}, [refreshTrigger]);

	const reload = useCallback(() => {
		// Force the admin serving-cities to be re-read so a city change in the
		// dashboard is reflected immediately, and let every section answer again.
		refreshAdminCities();
		setSections({});
		setRefreshTrigger((prev) => prev + 1);
		// Re-check which home this shopper gets (the admin may have started or
		// stopped serving them, or a second market may now deliver there).
		decideMode();
	}, [decideMode]);

	// Auto-refresh when the shopper changes their location from the header nav,
	// so the city-scoped feeds (markets, main store, categories) reload at once.
	// A new location can mean a different home altogether, so the skeleton
	// covers the page until that's decided.
	useEffect(() => {
		const sub = DeviceEventEmitter.addListener(USER_CITY_CHANGED, () => {
			setMode({ kind: "deciding" });
			reload();
		});
		return () => sub.remove();
	}, [reload]);

	// Pull-to-refresh on the single-market home: MarketHome reloads its own
	// sections; this re-checks whether it should still be the home.
	const recheckMode = useCallback(() => {
		refreshAdminCities();
		decideMode();
	}, [decideMode]);

	// Infinite scroll for the product grid at the bottom of the page: bump a
	// counter when the shopper nears the end; the grid loads its next page.
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

	// Freshly LB doesn't deliver here and one market does -> that market's
	// home page is the home tab (keyed so a different market starts fresh).
	if (mode.kind === "market") {
		return (
			<MarketHome
				key={String(mode.market._id)}
				marketId={String(mode.market._id)}
				market={mode.market}
				showBack={false}
				onRefresh={recheckMode}
			/>
		);
	}

	// Nothing at all for this city -> the empty state IS the page.
	if (isEmptyCity) {
		return (
			<View style={styles.container}>
				<ScrollView
					style={globalStyles.flex1}
					contentContainerStyle={styles.emptyContent}
					refreshControl={
						<RefreshControl refreshing={false} onRefresh={reload} />
					}
				>
					<RegionEmptyState region={city} />
				</ScrollView>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView
				style={globalStyles.flex1}
				contentContainerStyle={styles.scrollContent}
				onScroll={onScroll}
				scrollEventThrottle={100}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={reload} />
				}
			>
				<NewsTicker refreshTrigger={refreshTrigger} />
				<MarketsSlider
					refreshTrigger={refreshTrigger}
					onContent={onMarkets}
					hideLoader
				/>
				<KitchenSlider
					refreshTrigger={refreshTrigger}
					onContent={onKitchens}
					hideLoader
				/>
				<ProductSlide
					refreshTrigger={refreshTrigger}
					onContent={onHotSale}
					hideLoader
				/>
				<CatSlider
					refreshTrigger={refreshTrigger}
					onContent={onCategories}
					hideLoader
				/>
				<ProductList
					refreshTrigger={refreshTrigger}
					setRefreshing={setRefreshing}
					onContent={onProducts}
					loadMoreSignal={loadMoreSignal}
					hideLoader
				/>
				<Footer />
			</ScrollView>
			<RepeatOrderButton />
			{isLoading && <HomeSkeleton />}
		</View>
	);
}

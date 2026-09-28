"use client";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, LayoutAnimation, Text, View } from "react-native";

import ProductCard from "@/components/ProductCard";
import RegionEmptyState from "@/components/RegionEmptyState";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { PRODUCT_PAGE_SIZE as LIMIT } from "@/constants/api";
import { PRODUCT_GRID_ITEM_WIDTH } from "@/constants/layout";
import { colors } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { ProductService } from "@/services/api";
import { styles } from "@/styles/components/ProductList.styles";
import type { Product } from "@/types";
import type { ShopPageProps } from "@/types/components/ProductList.types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { getUserCityAndPin } from "@/utils/userCity";

export default function ShopPage({
	refreshTrigger,
	setRefreshing,
	marketId,
	onContent,
	hideLoader,
	loadMoreSignal,
}: ShopPageProps) {
	const { t } = useTranslation();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [page, setPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	// The shopper's region isn't served by the main store -> dead-end guard.
	const [unserved, setUnserved] = useState<{ city: string } | null>(null);
	// Live copies for the load-more handler (which runs from a parent effect).
	const stateRef = useRef({ loadingMore: false, hasMore: true, page: 1, loading: true });
	stateRef.current = { loadingMore, hasMore, page, loading };

	// Fetch products
	const fetchProducts = async (pageNum: number = 1) => {
		try {
			pageNum === 1 ? setLoading(true) : setLoadingMore(true);
			if (pageNum === 1) {
				setPage(1);
				setHasMore(true);
				setUnserved(null);
			}

			// Market mode: list THIS market's products. Markets have their own city
			// filtering, so the admin city gate does not apply here.
			if (marketId) {
				const res = await ProductService.list({
					page: pageNum,
					limit: LIMIT,
					isActive: true,
					inAds: "all",
					stockLevel: "Available",
					sortBy: "price",
					sortOrder: "desc",
					market: marketId,
				});
				const marketProducts = res.data || [];
				if (marketProducts.length < LIMIT) setHasMore(false);
				LayoutAnimation.easeInEaseOut();
				setProducts((prev) =>
					pageNum === 1 ? marketProducts : [...prev, ...marketProducts]
				);
				return;
			}

			// Main-store (admin) items are only shown to users in a city the admin
			// serves AND whose exact map pin falls inside the admin's configured
			// delivery-range circle(s), when set. Guests (no city/pin) and an
			// unconfigured admin still see everything.
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setProducts([]);
				setHasMore(false);
				setUnserved({ city });
				return;
			}

			// Home product list shows main-store items only (no market products).
			const res = await ProductService.list({
				page: pageNum,
				limit: LIMIT,
				isActive: true,
				inAds: "all",
				stockLevel: "Available",
				sortBy: "price",
				sortOrder: "desc",
				market: "none",
			});
			const newProducts = res.data || [];

			if (newProducts.length < LIMIT) setHasMore(false); // no more products
			LayoutAnimation.easeInEaseOut();
			setProducts((prev) =>
				pageNum === 1 ? newProducts : [...prev, ...newProducts]
			);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchProducts(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if (refreshTrigger && refreshTrigger > 0) {
			setRefreshing(true);
			fetchProducts(1).finally(() => setRefreshing(false));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshTrigger, setRefreshing]);

	// Infinite scroll: the parent ScrollView signals "near the bottom".
	useEffect(() => {
		if (!loadMoreSignal) return;
		const s = stateRef.current;
		if (s.loading || s.loadingMore || !s.hasMore) return;
		const nextPage = s.page + 1;
		setPage(nextPage);
		fetchProducts(nextPage);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadMoreSignal]);

	// Tell the home screen whether this section ended up with content. An
	// unserved region counts as content: the empty state IS the content, and
	// must not be replaced by the generic "no store" page.
	useEffect(() => {
		if (!loading) onContent?.(products.length > 0 || !!unserved);
	}, [loading, products, unserved, onContent]);

	if (loading && page === 1) {
		if (hideLoader) return null;
		return <ProductGridSkeleton count={6} />;
	}

	if (unserved) {
		return <RegionEmptyState region={unserved.city} />;
	}

	// Rendered as a wrapped row of cards (not a FlatList): this component lives
	// inside the home screen's vertical ScrollView, so a nested VirtualizedList
	// would warn — the parent handles scrolling and paging.
	return (
		<View style={styles.container}>
			<View style={styles.grid}>
				{products.map((item) => (
					<ProductCard key={item._id} product={item} width={PRODUCT_GRID_ITEM_WIDTH} />
				))}
				{loadingMore && (
					<ActivityIndicator style={styles.loadingMoreIndicator} color={colors.primary} />
				)}
				{!hasMore && products.length > 0 && (
					<Text style={styles.endNote}>{t("endOfList")}</Text>
				)}
			</View>
		</View>
	);
}

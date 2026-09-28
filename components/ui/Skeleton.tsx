import { useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

import { PRODUCT_CARD_COMPACT_MAX_WIDTH, PRODUCT_GRID_ITEM_WIDTH } from "@/constants/layout";
import { radius } from "@/constants/theme";
import { styles } from "@/styles/components/ui/Skeleton.styles";
import type {
	ProductGridSkeletonProps,
	SkeletonProps,
} from "@/types/components/ui/Skeleton.types";

// One shimmer loop shared by every Skeleton on screen, so they pulse in sync.
let shared: Animated.Value | null = null;
function useShimmer(): Animated.Value {
	if (!shared) {
		shared = new Animated.Value(0);
		Animated.loop(
			Animated.timing(shared, {
				toValue: 1,
				duration: 1200,
				easing: Easing.inOut(Easing.ease),
				useNativeDriver: true,
			}),
		).start();
	}
	return shared;
}

/** A soft-grey block with a shimmer sweep — the building block for every
 *  loading placeholder. Size it like the element it stands in for. */
export function Skeleton({
	width = "100%",
	height,
	borderRadius = radius.badge,
	style,
}: SkeletonProps) {
	const shimmer = useShimmer();
	const measured = useRef(0);
	const translateX = shimmer.interpolate({
		inputRange: [0, 1],
		outputRange: [-200, 400],
	});

	return (
		<View
			style={[
				styles.base,
				{ width, borderRadius },
				height !== undefined ? { height } : null,
				style,
			]}
			onLayout={(e) => {
				measured.current = e.nativeEvent.layout.width;
			}}
		>
			<Animated.View
				pointerEvents="none"
				style={[styles.shimmer, { transform: [{ translateX }] }]}
			/>
		</View>
	);
}

/** One placeholder card with the same geometry as <ProductCard />. */
export function ProductCardSkeleton({ width }: { width?: number }) {
	// Narrow (3-per-row) cards use ProductCard's compact geometry.
	const compact = (width ?? PRODUCT_GRID_ITEM_WIDTH) < PRODUCT_CARD_COMPACT_MAX_WIDTH;
	return (
		<View style={[styles.card, compact && styles.cardCompact, width ? { width } : null]}>
			<Skeleton style={styles.cardImage} borderRadius={radius.card} />
			<Skeleton height={14} width="90%" style={styles.line} />
			<Skeleton height={12} width="55%" style={styles.line} />
			<Skeleton height={18} width="70%" style={styles.line} />
			<Skeleton
				height={compact ? 32 : 36}
				width="100%"
				borderRadius={radius.badge}
				style={styles.button}
			/>
		</View>
	);
}

/** Placeholder grid that mirrors the 3-column catalog layout, so swapping in
 *  real cards causes no layout shift. */
export function ProductGridSkeleton({
	count = 6,
	cardWidth = PRODUCT_GRID_ITEM_WIDTH,
	horizontal = false,
}: ProductGridSkeletonProps) {
	const items = Array.from({ length: count });
	return (
		<View style={horizontal ? styles.row : styles.grid}>
			{items.map((_, i) => (
				<ProductCardSkeleton key={i} width={cardWidth} />
			))}
		</View>
	);
}

export default Skeleton;

import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	makeMutable,
	useAnimatedStyle,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

import { PRODUCT_CARD_COMPACT_MAX_WIDTH, PRODUCT_GRID_ITEM_WIDTH } from "@/constants/layout";
import { radius } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/ui/Skeleton.styles";
import type {
	ProductGridSkeletonProps,
	SkeletonProps,
} from "@/types/components/ui/Skeleton.types";
import { rtlRow } from "@/utils/rtl";

/** The shimmer band is this fraction of the block's width (see styles.shimmer). */
const SHIMMER_WIDTH_RATIO = 0.6;
/** Travel used until a block has been measured. */
const FALLBACK_BLOCK_WIDTH = 400;
/** One sweep across a block. */
const SHIMMER_SWEEP_MS = 1200;

// One shimmer clock (0 -> 1, repeating) shared by every Skeleton on screen,
// so they all sweep in sync. It is a Reanimated loop on the UI thread,
// started when the first Skeleton mounts and stopped when the last one
// unmounts — like the marquee and the search placeholder. The RN Animated
// loop it replaces was started only once per app session, and React Native
// stops a value's animation as soon as nothing is attached to it: after the
// first loading screen went away, every later skeleton showed a frozen band.
const shimmerProgress = makeMutable(0);
let shimmerUsers = 0;

function useShimmerProgress() {
	useEffect(() => {
		shimmerUsers += 1;
		if (shimmerUsers === 1) {
			shimmerProgress.value = 0;
			shimmerProgress.value = withRepeat(
				withTiming(1, { duration: SHIMMER_SWEEP_MS, easing: Easing.inOut(Easing.ease) }),
				-1,
				false,
			);
		}
		return () => {
			shimmerUsers -= 1;
			if (shimmerUsers === 0) cancelAnimation(shimmerProgress);
		};
	}, []);
	return shimmerProgress;
}

/** A soft-grey block with a shimmer sweep — the building block for every
 *  loading placeholder. Size it like the element it stands in for. */
export function Skeleton({
	width = "100%",
	height,
	borderRadius = radius.badge,
	style,
}: SkeletonProps) {
	const progress = useShimmerProgress();
	const { isRTL } = useTranslation();
	const [blockWidth, setBlockWidth] = useState(0);
	// The band starts fully hidden off one edge and leaves fully past the
	// other: left -> right in English, right -> left in Arabic (the reading
	// direction), whatever the block's width.
	const travel = blockWidth || FALLBACK_BLOCK_WIDTH;
	const hiddenStart = -travel * SHIMMER_WIDTH_RATIO;
	const from = isRTL ? travel : hiddenStart;
	const to = isRTL ? hiddenStart : travel;
	const shimmerStyle = useAnimatedStyle(
		() => ({ transform: [{ translateX: from + (to - from) * progress.value }] }),
		[from, to],
	);

	return (
		<View
			style={[
				styles.base,
				{ width, borderRadius },
				height !== undefined ? { height } : null,
				style,
			]}
			onLayout={(e) => {
				const measured = Math.round(e.nativeEvent.layout.width);
				if (measured !== blockWidth) setBlockWidth(measured);
			}}
		>
			<Animated.View pointerEvents="none" style={[styles.shimmer, shimmerStyle]} />
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
	const { isRTL } = useTranslation();
	const items = Array.from({ length: count });
	return (
		// Placeholders fill from the right in Arabic, like the real rows.
		<View style={[horizontal ? styles.row : styles.grid, rtlRow(isRTL)]}>
			{items.map((_, i) => (
				<ProductCardSkeleton key={i} width={cardWidth} />
			))}
		</View>
	);
}

export default Skeleton;

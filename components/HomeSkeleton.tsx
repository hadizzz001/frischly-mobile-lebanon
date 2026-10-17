import { StyleSheet, View } from "react-native";

import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import {
	GRID_GUTTER,
	MARKETS_SLIDER_ITEM_WIDTH,
	MARKETS_SLIDER_LOGO_ASPECT_RATIO,
	PRODUCT_SLIDE_ITEM_WIDTH,
} from "@/constants/layout";
import { colors, radius, spacing } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import type { HomeSkeletonProps } from "@/types/components/HomeSkeleton.types";
import { rtlAlign, rtlRow } from "@/utils/rtl";

// Full-page placeholder for the home screen while its sections load — mirrors
// the real layout (ticker, market row, hot-sale carousel, category row, grid)
// so the content settles into place instead of flashing in. The "market"
// variant is the same page without the ticker and markets row (a market's home).
export default function HomeSkeleton({ variant = "home" }: HomeSkeletonProps) {
	const { isRTL } = useTranslation();
	return (
		<View style={styles.page} pointerEvents="none">
			{variant === "home" && (
				<>
					<Skeleton height={36} borderRadius={radius.badge} style={styles.ticker} />
					<Skeleton height={20} width={140} style={[styles.sectionTitle, rtlAlign(isRTL)]} />
					<View style={[styles.row, rtlRow(isRTL)]}>
						{[0, 1, 2].map((i) => (
							<Skeleton
								key={i}
								width={MARKETS_SLIDER_ITEM_WIDTH}
								height={Math.round(MARKETS_SLIDER_ITEM_WIDTH / MARKETS_SLIDER_LOGO_ASPECT_RATIO)}
								borderRadius={radius.card}
							/>
						))}
					</View>
				</>
			)}
			<Skeleton height={20} width={120} style={[styles.sectionTitle, rtlAlign(isRTL)]} />
			<ProductGridSkeleton count={3} cardWidth={PRODUCT_SLIDE_ITEM_WIDTH} horizontal />
			<Skeleton height={20} width={160} style={[styles.sectionTitle, rtlAlign(isRTL)]} />
			<View style={[styles.row, rtlRow(isRTL)]}>
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} width={72} height={88} borderRadius={radius.card} />
				))}
			</View>
			<ProductGridSkeleton count={6} />
		</View>
	);
}

const styles = StyleSheet.create({
	page: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.background,
		zIndex: 10,
		paddingTop: spacing.sm,
		overflow: "hidden",
	},
	ticker: { marginHorizontal: GRID_GUTTER, marginBottom: spacing.md },
	sectionTitle: { marginHorizontal: GRID_GUTTER, marginTop: spacing.md, marginBottom: spacing.sm },
	row: { flexDirection: "row", gap: spacing.md, paddingHorizontal: GRID_GUTTER, marginBottom: spacing.sm },
});

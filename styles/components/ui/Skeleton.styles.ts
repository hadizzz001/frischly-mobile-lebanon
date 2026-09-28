import { StyleSheet } from "react-native";

import { PRODUCT_GRID_GAP, PRODUCT_GRID_ITEM_WIDTH } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.surfaceAlt,
		overflow: "hidden",
	},
	shimmer: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(255,255,255,0.55)",
		width: "60%",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: spacing.md,
		gap: PRODUCT_GRID_GAP,
	},
	row: {
		flexDirection: "row",
		paddingHorizontal: spacing.md,
		gap: PRODUCT_GRID_GAP,
	},
	// Mirrors ProductCard.styles.card exactly so nothing shifts when real
	// cards replace the placeholders.
	card: {
		width: PRODUCT_GRID_ITEM_WIDTH,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		padding: spacing.sm,
		...shadow.card,
	},
	cardCompact: { padding: 6 },
	cardImage: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: radius.card,
		marginBottom: spacing.sm,
	},
	line: { marginBottom: spacing.sm },
	button: { marginTop: spacing.xs },
});

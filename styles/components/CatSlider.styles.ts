import { StyleSheet } from "react-native";

import { CAT_SLIDER_ITEM_HEIGHT as ITEM_HEIGHT, GRID_GUTTER, SCREEN_WIDTH } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

// Four category tiles per row on an 8pt grid: 16px gutters + 8px gaps.
const TILE_WIDTH = (SCREEN_WIDTH - GRID_GUTTER * 2 - spacing.sm * 3) / 4;

export const styles = StyleSheet.create({
	loadingContainer: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
	sectionContainer: { backgroundColor: colors.background, paddingBottom: spacing.md },
	gridContainer: {
		paddingHorizontal: GRID_GUTTER,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	card: { width: TILE_WIDTH, alignItems: "center" },
	imageWrapper: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: colors.surfaceAlt,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: radius.card,
		marginBottom: spacing.xs,
		padding: spacing.sm,
		...shadow.card,
	},
	image: { width: "100%", height: "100%" },
	imagePlaceholder: { fontSize: 24, fontWeight: "700", color: colors.textSecondary },
	name: { fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center", lineHeight: 16 },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: GRID_GUTTER,
		paddingVertical: spacing.sm,
	},
	headerTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
	headerText: { fontSize: 18, fontWeight: "700", color: colors.text },
	headerRight: { flexDirection: "row", alignItems: "center" },
	allButton: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
	allText: { fontSize: 14, fontWeight: "600", color: colors.link },
});

import { StyleSheet } from "react-native";

import { GRID_GUTTER, PRODUCT_GRID_GAP, PRODUCT_SLIDE_ITEM_HEIGHT as ITEM_HEIGHT } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	loadingContainer: { minHeight: ITEM_HEIGHT, justifyContent: "center", paddingVertical: spacing.sm },
	wrapper: { backgroundColor: colors.background, paddingBottom: spacing.md },
	listContent: { paddingHorizontal: GRID_GUTTER, paddingVertical: spacing.xs },
	separator: { width: PRODUCT_GRID_GAP },
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

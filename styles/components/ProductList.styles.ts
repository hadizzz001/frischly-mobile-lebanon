import { StyleSheet } from "react-native";

import { GRID_GUTTER, PRODUCT_GRID_GAP } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { flex: 1 },
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingHorizontal: GRID_GUTTER,
		gap: PRODUCT_GRID_GAP,
		paddingBottom: spacing.sm,
	},
	loader: {
		paddingVertical: spacing.md,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	loadingMoreIndicator: { marginVertical: spacing.md, width: "100%" },
	endNote: {
		width: "100%",
		textAlign: "center",
		fontSize: 12,
		color: colors.textDisabled,
		paddingVertical: spacing.sm,
	},
});

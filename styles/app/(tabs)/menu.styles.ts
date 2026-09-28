import { StyleSheet } from "react-native";

import {
	GRID_GUTTER,
	MENU_ITEM_HEIGHT as ITEM_HEIGHT,
	MENU_ITEM_WIDTH as ITEM_WIDTH,
	PRODUCT_GRID_GAP,
} from "@/constants/layout";
import { colors, radius, spacing } from "@/constants/theme";

// 3-per-row category grid: same gutter/gap/card width as the product grid.
export const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: colors.background,
		paddingBottom: 10, // ✔ extra bottom padding (iPad fix)
	},

	gridContainer: {
		paddingHorizontal: GRID_GUTTER,
		paddingBottom: 200, // ✔ ensures bottom items are fully visible
		paddingTop: 20,
	},
	row: { gap: PRODUCT_GRID_GAP, marginBottom: spacing.md },

	loadingBox: {
		height: ITEM_HEIGHT,
		justifyContent: "center",
		alignItems: "center",
	},

	card: {
		width: ITEM_WIDTH,
		backgroundColor: "transparent",
		alignItems: "center",
	},

	imageWrapper: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: colors.surface,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: radius.badge,
		marginBottom: 6,
		padding: spacing.xs,
	},

	image: { width: "100%", height: "100%", borderRadius: radius.badge },

	name: {
		fontSize: 13,
		lineHeight: 17,
		fontWeight: "500",
		color: colors.text,
		textAlign: "center",
	},
});

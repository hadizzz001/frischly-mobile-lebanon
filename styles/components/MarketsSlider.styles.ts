import { StyleSheet } from "react-native";

import { colors, radius, shadow } from "@/constants/theme";

import {
	MARKETS_SLIDER_ITEM_SPACING as ITEM_SPACING,
	MARKETS_SLIDER_ITEM_WIDTH as ITEM_WIDTH,
	MARKETS_SLIDER_LOGO_ASPECT_RATIO as LOGO_ASPECT_RATIO,
} from "@/constants/layout";

export const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		marginTop: 8,
		paddingBottom: 10,
	},
	loaderBox: {
		height: 120,
		justifyContent: "center",
		alignItems: "center",
	},
	viewport: {
		overflow: "hidden",
		paddingHorizontal: 8,
	},
	// Vertical room so the cards' shadows are not clipped by the scroller.
	track: {
		flexDirection: "row",
		paddingVertical: 4,
	},
	// The card IS the logo tile: the framed logo (its own background colour,
	// even margin, 5:4) fills it edge to edge — no grey box around a logo.
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: ITEM_SPACING / 2,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		...shadow.card,
	},
	imageWrapper: {
		width: "100%",
		aspectRatio: LOGO_ASPECT_RATIO,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
		borderRadius: radius.card,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 28,
		fontWeight: "700",
		color: colors.textSecondary,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
	headerText: { fontSize: 18, fontWeight: "700", color: colors.text },
});

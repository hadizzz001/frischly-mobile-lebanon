import { StyleSheet } from "react-native";

import { colors, radius, shadow } from "@/constants/theme";

import {
	MARKETS_SLIDER_ITEM_SPACING as ITEM_SPACING,
	MARKETS_SLIDER_ITEM_WIDTH as ITEM_WIDTH,
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
	track: {
		flexDirection: "row",
	},
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: ITEM_SPACING / 2,
		alignItems: "center",
		backgroundColor: colors.background,
		borderRadius: radius.card,
		padding: 8,
		...shadow.card,
	},
	imageWrapper: {
		width: "100%",
		height: 84,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.surfaceAlt,
		borderRadius: radius.badge,
		padding: 8,
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

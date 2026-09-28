import { StyleSheet } from "react-native";

import { colors, radius, shadow } from "@/constants/theme";

import { KITCHEN_SLIDER_ITEM_WIDTH as ITEM_WIDTH } from "@/constants/layout";

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
	track: {
		paddingHorizontal: 8,
	},
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 8,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		padding: 8,
		...shadow.card,
	},
	imageWrapper: {
		width: "100%",
		height: 110,
		backgroundColor: colors.surfaceAlt,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: radius.badge,
		marginBottom: 8,
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 34,
		fontWeight: "700",
		color: colors.textSecondary,
	},
	name: {
		fontSize: 14,
		fontWeight: "600",
		color: colors.text,
		textAlign: "center",
		marginBottom: 4,
	},
});

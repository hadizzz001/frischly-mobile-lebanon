import { StyleSheet } from "react-native";

import {
	MENU_ITEM_HEIGHT as ITEM_HEIGHT,
	MENU_ITEM_WIDTH as ITEM_WIDTH,
} from "@/constants/layout";

export const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: "#fff",
		paddingBottom: 10, // ✔ extra bottom padding (iPad fix)
	},

	gridContainer: {
		paddingHorizontal: 10,
		paddingBottom: 200, // ✔ ensures bottom items are fully visible
		paddingTop: 20, // ✔ ensures bottom items are fully visible
	},

	loadingBox: {
		height: ITEM_HEIGHT,
		justifyContent: "center",
		alignItems: "center",
	},

	card: {
		width: ITEM_WIDTH,
		margin: 8,
		backgroundColor: "transparent",
		alignItems: "center",
	},

	imageWrapper: {
		width: "100%",
		height: 100,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
	},

	image: { width: "100%", height: "100%", borderRadius: 8 },

	name: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
		textAlign: "center",
	},
});

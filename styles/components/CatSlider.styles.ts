import { StyleSheet } from "react-native";

import {
	CAT_SLIDER_ITEM_HEIGHT as ITEM_HEIGHT,
	CAT_SLIDER_ITEM_WIDTH as ITEM_WIDTH,
} from "@/constants/layout";

export const styles = StyleSheet.create({
	loadingContainer: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
	sectionContainer: {
		backgroundColor: "#fff",
		marginTop: 30,
		paddingBottom: 20,
	},
	gridContainer: {
		paddingHorizontal: 8,
		flexDirection: "row",
		flexWrap: "wrap",
	},
	card: {
		width: ITEM_WIDTH,
		margin: 5,
		backgroundColor: "transparent",
		alignItems: "center",
	},
	imageWrapper: {
		width: "100%",
		height: 80,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
	},
	image: { width: "100%", height: "100%", borderRadius: 8 },
	imagePlaceholder: {
		fontSize: 28,
		fontWeight: "700",
		color: "#f4bb26",
	},
	name: {
		fontSize: 12,
		fontWeight: "500",
		color: "#333",
		textAlign: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000" },
	headerRight: { flexDirection: "row", alignItems: "center" },
	allButton: {
		marginRight: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	allText: { fontSize: 18, fontWeight: "500", color: "#777" },
});

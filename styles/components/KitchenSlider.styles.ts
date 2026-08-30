import { StyleSheet } from "react-native";

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
	headerText: { fontSize: 20, fontWeight: "700", color: "#000" },
	track: {
		paddingHorizontal: 8,
	},
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 5,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 8,
	},
	imageWrapper: {
		width: "100%",
		height: 110,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 34,
		fontWeight: "700",
		color: "#f4bb26",
	},
	name: {
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
		textAlign: "center",
		marginBottom: 4,
	},
});

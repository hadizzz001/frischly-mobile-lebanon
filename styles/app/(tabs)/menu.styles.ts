import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const ITEM_WIDTH = width / NUM_COLUMNS - 20;
const ITEM_HEIGHT = 130;

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

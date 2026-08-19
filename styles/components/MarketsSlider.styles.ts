import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const ITEM_SPACING = 10;
const ITEM_WIDTH = width / 3 - 16;

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
	},
	imageWrapper: {
		width: "100%",
		height: 90,
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 28,
		fontWeight: "700",
		color: "#f4bb26",
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
});

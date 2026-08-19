import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 12; // Show exactly 3 per row
const ITEM_HEIGHT = 180;

export const styles = StyleSheet.create({
	loadingContainer: { height: ITEM_HEIGHT, justifyContent: "center", alignItems: "center" },
	wrapper: { height: ITEM_HEIGHT + 80, backgroundColor: "#FFFFFF" },
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 4,
		backgroundColor: "#FFFFFF",
		padding: 8,
		height: 200,
		overflow: "hidden",
		borderRadius: 8,
	},
	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 100,
		marginBottom: 6,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	outOfStockText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#f4bb26",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
	name: { fontSize: 14, fontWeight: "400", marginBottom: 4, color: "#777" },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 5,
		paddingHorizontal: 12,
		paddingVertical: 5,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000000" },
	headerRight: { flexDirection: "row", alignItems: "center" },
	allButton: {
		marginRight: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	allText: { fontSize: 18, fontWeight: "500", color: "#777" },
	newPrice: { fontSize: 13, fontWeight: "500", color: "#000000" },
	qtyRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
	},
	qtyBtn: {
		backgroundColor: "#f4bb26",
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
		marginHorizontal: 4,
	},
	qtyBtnCartPadding: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	qtyText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fff",
	},
	qtyValue: {
		marginHorizontal: 6,
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	priceRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10, // or marginRight on basePrice
},

basePrice: {
  color: "#b3b3b3ff",
  textDecorationLine: "line-through",
  fontSize: 13,
},

finalPrice: {
  color: "red",
  fontWeight: "bold",
  fontSize: 13,
},

});

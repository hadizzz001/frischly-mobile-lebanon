import { StyleSheet } from "react-native";

import { PRODUCT_LIST_ITEM_WIDTH as ITEM_WIDTH } from "@/constants/layout";

export const styles = StyleSheet.create({
	gridItem: { width: ITEM_WIDTH, margin: 5 },
	container: { flex: 1 },
	grid: { padding: 10 },
	row: { flexDirection: "row" },
	card: { width: ITEM_WIDTH, margin: 5, backgroundColor: "#fff", padding: 8 },

	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },
	outOfStockOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	outOfStockText: { color: "#fff", fontWeight: "700", fontSize: 16 },
	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "red",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
	name: { fontSize: 13, fontWeight: "500", marginBottom: 4, color: "#777" },
	weight: { fontSize: 11, color: "#999", marginBottom: 4 },
	finalPrice: { fontSize: 15, fontWeight: "700", color: "#333" },
	basePrice: {
		textDecorationLine: "line-through",
		color: "#777",
		marginRight: 6,
		fontSize: 13,
	},
	priceRow: { flexDirection: "row", alignItems: "center" },
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	loadMoreBtn: {
		margin: 20,
		padding: 12,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		alignItems: "center",
	},
	loadMoreText: {
		color: "#333",
		fontWeight: "700",
		fontSize: 16,
	},
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
	qtyText: { fontSize: 14, fontWeight: "700", color: "#fff" },
	qtyValue: {
		marginHorizontal: 6,
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	qtyBtnCartPadding: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	loadingMoreIndicator: {
		margin: 20,
	},
});

import { StyleSheet } from "react-native";

import { SCREEN_WIDTH as width } from "@/constants/layout";

// Product detail screen — deliberately minimal, top to bottom:
//   image -> discount badge -> title -> weight -> tax/refund lines ->
//   price (final + old) -> category link, with a fixed quantity + add bar
//   pinned to the bottom of the screen.
// The weight line and the price row are rendered at the same size.
const INFO_FONT_SIZE = 13;

export const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#fff" },
	container: { flex: 1, backgroundColor: "#fff" },
	// Leave room for the fixed bottom bar.
	scrollContent: { paddingBottom: 130 },
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	backButton: {
		position: "absolute",
		top: 8,
		zIndex: 10,
		padding: 6,
		borderRadius: 20,
		backgroundColor: "rgba(255,255,255,0.9)",
	},
	// Edge of the back button: left in English, right in Arabic.
	backButtonLeft: { left: 8 },
	backButtonRight: { right: 8 },

	// Image
	imageBox: {
		width: "100%",
		height: width * 0.85,
		backgroundColor: "#f7f7f7",
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },

	info: { paddingHorizontal: 16, paddingTop: 14 },

	// Small red "-20% OFF" box
	discountBadge: {
		alignSelf: "flex-start",
		backgroundColor: "#e11d1d",
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 4,
		marginBottom: 10,
	},
	discountBadgeText: {
		color: "#fff",
		fontSize: 11,
		fontWeight: "700",
	},

	title: { fontSize: 24, fontWeight: "800", color: "#111" },
	weight: { fontSize: INFO_FONT_SIZE, color: "#8a8a8a", marginTop: 4 },
	meta: { fontSize: 12, color: "#9a9a9a", marginTop: 2 },

	// LBP + USD share one row and one font size: LBP regular, USD thin.
	priceRow: {
		flexDirection: "row",
		alignItems: "baseline",
		flexWrap: "wrap",
		marginTop: 14,
		gap: 8,
	},
	priceLbp: { fontSize: INFO_FONT_SIZE, fontWeight: "700", color: "#e11d1d" },
	priceUsd: { fontSize: INFO_FONT_SIZE, fontWeight: "300", color: "#e11d1d" },
	priceNoDiscount: { color: "#111" },
	oldPrice: {
		fontSize: INFO_FONT_SIZE,
		color: "#9a9a9a",
		textDecorationLine: "line-through",
	},

	description: { fontSize: 13, color: "#555", lineHeight: 19, marginTop: 14 },

	// Fixed bottom bar
	bottomBar: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	bottomBarInner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	qtyBox: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#e5e5e5",
		borderRadius: 10,
		paddingHorizontal: 4,
		paddingVertical: 4,
	},
	qtyBtn: {
		width: 34,
		height: 40,
		justifyContent: "center",
		alignItems: "center",
	},
	qtyBtnText: { fontSize: 20, fontWeight: "700", color: "#111" },
	qtyBtnDisabled: { opacity: 0.3 },
	qtyValue: {
		minWidth: 26,
		textAlign: "center",
		fontSize: 16,
		fontWeight: "700",
		color: "#111",
	},
	addBtn: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		backgroundColor: "#F59E0B",
		borderRadius: 10,
		paddingVertical: 14,
	},
	addBtnDisabled: { opacity: 0.5 },
	addBtnText: { color: "#111827", fontSize: 15, fontWeight: "700" },
	// LBP + USD sit on a single line at the end of the button.
	addBtnPrices: {
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 1,
		gap: 5,
	},
	addBtnPriceLbp: { color: "#111827", fontSize: 13, fontWeight: "700" },
	addBtnPriceUsd: { color: "#111827", fontSize: 11, fontWeight: "600", opacity: 0.9 },

	// Image zoom modal
	zoomOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.85)",
		justifyContent: "center",
		alignItems: "center",
	},
	zoomImage: { width, height: width },
});

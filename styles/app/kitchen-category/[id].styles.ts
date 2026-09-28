import { StyleSheet } from "react-native";

import {
	KITCHEN_CATEGORY_CARD_WIDTH as CARD_WIDTH,
	GRID_GUTTER,
	PRODUCT_GRID_GAP,
} from "@/constants/layout";

export const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#fff" },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		paddingTop: 80,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 8,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	backButton: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
	},
	topTitle: {
		flex: 1,
		fontSize: 18,
		fontWeight: "700",
		color: "#222",
		textAlign: "center",
	},
	// 3-per-row grid, same geometry as the product grid (gap-based so a short
	// last row stays left-aligned instead of spreading to the edges).
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		columnGap: PRODUCT_GRID_GAP,
		rowGap: 14,
		paddingHorizontal: GRID_GUTTER,
		paddingTop: 12,
		paddingBottom: 140,
	},
	card: {
		width: CARD_WIDTH,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 6,
		justifyContent: "space-between",
	},
	imageWrapper: {
		width: "100%",
		aspectRatio: 1,
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
		color: "#F59E0B",
	},
	name: {
		fontSize: 13,
		fontWeight: "600",
		color: "#222",
		textAlign: "center",
	},
	itemCount: {
		fontSize: 12,
		color: "#777",
		textAlign: "center",
		marginBottom: 8,
	},
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		backgroundColor: "#F59E0B",
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	addBtnDisabled: {
		opacity: 0.5,
	},
	checkoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		backgroundColor: "#F59E0B",
		borderRadius: 8,
		paddingVertical: 8,
		paddingHorizontal: 4,
	},
	// Shrinks to fit the narrow 3-per-row card instead of being cut off.
	btnText: {
		flexShrink: 1,
		color: "#111827",
		fontWeight: "700",
		fontSize: 12,
	},
	emptyText: {
		fontSize: 14,
		color: "#777",
		textAlign: "center",
		paddingHorizontal: 16,
	},
	root: { flex: 1, backgroundColor: "#fff" },
	spacer36: { width: 36 },
});

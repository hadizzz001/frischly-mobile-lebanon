import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
// Two cards per row: 12px outer padding on each side + 12px gutter between.
const CARD_WIDTH = (width - 36) / 2;

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
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 140,
	},
	card: {
		width: CARD_WIDTH,
		marginBottom: 14,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 8,
	},
	imageWrapper: {
		width: "100%",
		height: 120,
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
		gap: 6,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		paddingVertical: 8,
	},
	addBtnDisabled: {
		backgroundColor: "#cccccc",
	},
	checkoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "#22a45d",
		borderRadius: 8,
		paddingVertical: 8,
	},
	btnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 13,
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

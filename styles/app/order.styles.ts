import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	loadingIndicator: { flex: 1, justifyContent: "center" },
	backButton: {
		marginBottom: 15,
	},
	listContent: {
		paddingBottom: 120,
	},
	cancelModalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	cancelModalCard: {
		width: "85%",
		backgroundColor: "#fff",
		borderRadius: 8,
		padding: 20,
	},
	cancelModalTitle: {
		fontWeight: "bold",
		marginBottom: 10,
	},
	cancelModalInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 6,
		padding: 10,
		marginBottom: 15,
		height: 80,
		textAlignVertical: "top",
	},
	cancelModalActions: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	cancelModalCancelBtn: {
		padding: 10,
		backgroundColor: "#ccc",
		borderRadius: 6,
		flex: 1,
		marginRight: 5,
	},
	cancelModalCancelText: {
		textAlign: "center",
		color: "#000",
	},
	cancelModalSubmitBtn: {
		padding: 10,
		backgroundColor: "red",
		borderRadius: 6,
		flex: 1,
		marginLeft: 5,
	},
	cancelModalSubmitText: {
		textAlign: "center",
		color: "#fff",
	},
	container: {
		flex: 1,
		padding: 12,
		backgroundColor: "#f7f7f8",
	},
	orderCard: {
		marginBottom: 14,
		borderRadius: 14,
		backgroundColor: "#fff",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 6,
		elevation: 3,
		overflow: "hidden",
	},
	orderHeader: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		padding: 14,
		backgroundColor: "#fff",
	},
	orderHeaderLeft: {
		flex: 1.3,
		paddingRight: 8,
	},
	orderHeaderRight: {
		flex: 1,
		alignItems: "flex-end",
	},
	orderId: {
		fontSize: 15,
		fontWeight: "800",
		color: "#111111",
	},
	orderDate: {
		fontSize: 11,
		color: "#999999",
		marginTop: 2,
	},
	statusBadge: {
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
		gap: 5,
		paddingVertical: 3,
		paddingHorizontal: 9,
		borderRadius: 20,
		marginTop: 6,
	},
	statusDot: {
		width: 6,
		height: 6,
		borderRadius: 3,
	},
	statusBadgeText: {
		fontSize: 11,
		fontWeight: "700",
		textTransform: "capitalize",
	},
	summaryText: {
		fontSize: 12,
		color: "#555555",
		marginBottom: 2,
		textAlign: "right",
	},
	totalText: {
		fontSize: 14,
		fontWeight: "800",
		color: "#111111",
		marginTop: 3,
		textAlign: "right",
	},
	chevron: {
		marginLeft: 6,
		marginTop: 2,
	},
	itemsContainer: {
		padding: 14,
		paddingTop: 12,
		backgroundColor: "#fff",
		borderTopWidth: 1,
		borderTopColor: "#f0f0f0",
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingBottom: 10,
		marginBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#f4f4f4",
	},
	itemImage: {
		width: 48,
		height: 48,
		borderRadius: 8,
		marginRight: 10,
		backgroundColor: "#f5f5f5",
	},
	itemImagePlaceholder: {
		alignItems: "center",
		justifyContent: "center",
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 13,
		fontWeight: "600",
		color: "#222222",
		marginBottom: 4,
	},
	itemMetaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	itemMetaText: {
		fontSize: 12,
		color: "#888888",
	},
	itemPriceText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#222222",
	},
	paymentMethod: {
		fontSize: 11,
		color: "#999999",
		marginTop: 6,
	},
	actionRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
		marginTop: 4,
	},
	actionBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 4,
		paddingVertical: 7,
		paddingHorizontal: 9,
		borderRadius: 8,
		minWidth: 44,
	},
	actionBtnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 11,
		textAlign: "center",
	},
	trackBtn: {
		backgroundColor: "#2563eb",
	},
	payBtn: {
		backgroundColor: "#16a34a",
	},
	cancelBtn: {
		backgroundColor: "#dc2626",
	},
	repeatBtn: {
		backgroundColor: "#f4bb26",
	},
	repeatBtnText: {
		color: "#222222",
	},
	safeArea: {
		flex: 1,
		backgroundColor: "#f7f7f8",
	},
});

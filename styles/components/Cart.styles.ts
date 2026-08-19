import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#FFFFFF",
	},
	heading: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 12,
		textAlign: "center", // center the heading
	},
	cartList: {
		flex: 1,
		marginBottom: 10,
	},
	cartItem: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#000000",
		borderRadius: 8,
		padding: 10,
		position: "relative",
		overflow: "visible", // <-- make sure remove button is visible
	},

	removeBtn: {
		position: "absolute",
		top: 50, // slightly above the item container
		right: 50, // slightly outside the right edge
		width: 40,
		height: 40,
		backgroundColor: "transparent",
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 99999999, // <-- very high to be on top
	},

	itemImage: {
		width: 80,
		height: 80,
		marginRight: 10,
		borderRadius: 6,
	},
	details: {
		flex: 1,
	},
	itemTitle: {
		marginBottom: 4,
		fontSize: 16,
	},
	itemCategory: {
		fontSize: 12,
		color: "#000000",
		marginBottom: 4,
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	label: {
		marginRight: 5,
	},
	qtyInput: {
		borderWidth: 1,
		borderColor: "#000000",
		width: 50,
		height: 50,
		textAlign: "center",
		borderRadius: 6,
	},
	price: {
		marginTop: 6,
		fontWeight: "bold",
		color: "#000000",
	},

	emptyText: {
		textAlign: "center",
		marginTop: 40,
		color: "#000000",
	},
	footer: {
		paddingVertical: 12,
		borderTopWidth: 1,
		borderColor: "#000000",
		marginBottom: 20,
	},
	total: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	checkoutBtn: {
		backgroundColor: "#f4bb26",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	checkoutText: {
		color: "#000000",
		fontWeight: "bold",
	},
	clearCartLink: {
		alignItems: "center",
		paddingVertical: 12,
		marginTop: 4,
	},
	clearCartText: {
		color: "red",
		fontWeight: "600",
		textDecorationLine: "underline",
	},
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		width: "80%",
	},
	modalTitle: {
		marginBottom: 20,
		textAlign: "center",
		fontWeight: "bold",
	},
	modalMessage: {
		marginBottom: 30,
		textAlign: "center",
	},
	modalButtons: {
		width: "100%",
	},
	yesButton: {
		backgroundColor: "#f4bb26",
		paddingVertical: 16,
		borderRadius: 8,
		marginBottom: 15,
		width: "100%",
	},
	yesButtonText: {
		color: "black",
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 18,
	},
	noButton: {
		paddingVertical: 16,
		borderRadius: 8,
		width: "100%",
	},
	noButtonText: {
		color: "#f4bb26",
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 18,
	},

});

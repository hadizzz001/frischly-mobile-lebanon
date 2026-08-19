import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	scrollContent: { paddingBottom: 160, flexGrow: 1 },
	rowSpaceBetween: { flexDirection: "row", justifyContent: "space-between" },
	flex1MarginRight: { flex: 1, marginRight: 4 },
	flex1MarginLeft: { flex: 1, marginLeft: 4 },
	modalOverlay: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.5)",
	},
	modalBox: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 12,
		width: "80%",
		alignItems: "center",
	},
	modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
	modalInput: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 10,
		width: "100%",
		marginBottom: 15,
	},
	modalButtonRow: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
	modalCancelButton: { flex: 1, backgroundColor: "#ccc", marginRight: 5 },
	modalDeleteButton: { flex: 1, backgroundColor: "#FF4444", marginLeft: 5 },
	blackBoldText: { color: "#000", fontWeight: "bold" },
	whiteBoldText: { color: "#fff", fontWeight: "bold" },
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	header: {
		alignItems: "center",
		paddingVertical: 20, // reduced from 40
		paddingHorizontal: 20,
	},
	avatarContainer: {
		marginBottom: 16,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#000000",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#000000",
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 16,
		color: "#666666",
		textAlign: "center",
	},
	infoCard: {
		backgroundColor: "#FFFFFF",
		margin: 20,
		borderRadius: 16,
		padding: 20,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#F0F0F0",
	},
	guestCard: {
		backgroundColor: "#FFFFFF",
		margin: 20,
		borderRadius: 16,
		padding: 40,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 4,
		borderWidth: 1,
		borderColor: "#F0F0F0",
	},
	guestText: {
		fontSize: 18,
		fontWeight: "600",
		color: "#000000",
		marginTop: 16,
		textAlign: "center",
	},
	guestSubtext: {
		fontSize: 14,
		color: "#666666",
		marginTop: 8,
		textAlign: "center",
	},
	cardTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#000000",
		marginBottom: 20,
	},
	infoRow: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#F5F5F5",
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#FFF8E1",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 16,
	},
	infoContent: {
		flex: 1,
	},
	infoLabel: {
		fontSize: 12,
		color: "#666666",
		textTransform: "uppercase",
		fontWeight: "600",
		letterSpacing: 0.5,
		textAlign: "center",
	},
	infoValue: {
		fontSize: 16,
		color: "#000000",
		fontWeight: "500",
		marginTop: 2,
		textAlign: "center",
	},
	addressSection: {
		marginTop: 20,
		paddingTop: 20,
		borderTopWidth: 1,
		borderTopColor: "#E0E0E0",
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#f4bb26",
		textAlign: "center",
		marginBottom: 16,
		letterSpacing: 1,
	},
	actionsContainer: {
		paddingHorizontal: 20,
		paddingBottom: 200, // extra space for safe scroll
	},
	actionButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		marginVertical: 8,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	loginButton: {
		backgroundColor: "#f4bb26",
	},
	logoutButton: {
		backgroundColor: "#f4bb26",
	},
	deleteButton: {
		backgroundColor: "#FF4444",
	},
	buttonIcon: {
		marginRight: 8,
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
	loginText: {
		color: "#000000",
	},
	logoutText: {
		color: "#000000",
	},
	deleteText: {
		color: "#FFFFFF",
	},
	viewOrdersButton: {
		backgroundColor: "#f4bb26", // example yellow or keep same style as others
	},

	viewOrdersText: {
		color: "#000",
	},

	rowActions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},

	actionButtonSmall: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderRadius: 10,
		flex: 1,
		marginHorizontal: 4,
		backgroundColor: "#f4bb26",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},

	actionButtonTextSmall: {
		fontSize: 14,
		fontWeight: "600",
	},
});

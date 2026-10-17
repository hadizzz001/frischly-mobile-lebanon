import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	outerContainer: {
		paddingHorizontal: 16,
		marginVertical: 8,
	},
	container: {
		width: "100%",
		height: 36,
		backgroundColor: "#FEF3C7",
		borderRadius: 8,
		flexDirection: "row",
		alignItems: "center",
		overflow: "hidden",
	},
	iconContainer: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
	},
	tickerContainer: {
		flex: 1,
		justifyContent: "center",
		paddingRight: 12,
	},
	// Arabic: the gift icon sits on the right, so the free edge is the left.
	tickerContainerRTL: { paddingRight: 0, paddingLeft: 12 },
	tickerText: {
		fontSize: 12,
		color: "#111827",
		fontWeight: "600",
		letterSpacing: 0.2,
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
		width: "90%",
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 20,
		color: "#333",
	},
	scrollView: {
		maxHeight: 400,
	},
	promoCard: {
		backgroundColor: "#f9f9f9",
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: "#F59E0B",
	},
	companyName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	description: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	code: {
		fontSize: 16,
		fontWeight: "600",
		color: "#F59E0B",
	},
	closeButton: {
		backgroundColor: "#F59E0B",
		paddingVertical: 12,
		borderRadius: 8,
		marginTop: 20,
		alignItems: "center",
	},
	closeButtonText: {
		color: "#111827",
		fontSize: 16,
		fontWeight: "bold",
	},
});

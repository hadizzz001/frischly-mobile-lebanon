import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	topBanner: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f4bb26",
		borderBottomLeftRadius: 60,
		borderBottomRightRadius: 60,
		overflow: "hidden",
	},
	updateButton: {
		borderRadius: 15,
		paddingVertical: 15,
		width: "100%",
		alignItems: "center",
		marginTop: 20,
	},
	flexWhite: {
		flex: 1,
		backgroundColor: "#fff",
	},
	scrollContent: {
		flexGrow: 1,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#000",
	},
	formContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		backgroundColor: "#fff",
		marginTop: 30,
	},
	updateButtonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 18,
	},
	bottomSpacer: {
		height: 200,
	},
	inputContainer: {
		flexDirection: "row",
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
		backgroundColor: "#fff",
		marginBottom: 12,
	},
	input: {
		flex: 1,
		padding: 15,
		color: "#000",
	},
});

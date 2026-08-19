import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	scrollContainer: { flex: 1, backgroundColor: "#FFFFFF" },
	contentContainer: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
		paddingBottom: 100,
	},
	inner: { alignItems: "center" },
	title: {
		fontSize: 22,
		fontWeight: "bold",
		marginTop: 20,
		color: "#000",
		textAlign: "center",
	},
	subtitle: {
		fontSize: 16,
		marginTop: 10,
		marginBottom: 20,
		color: "#000000",
		textAlign: "center",
	},
	button: {
		backgroundColor: "#f4bb26",
		borderRadius: 5,
		height: 50,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 20,
		width: "100%",
		shadowOpacity: 0.3,
		shadowOffset: { width: 0, height: 4 },
		shadowRadius: 4,
		elevation: 5,
	},
	buttonText: {
		color: "#000",
		fontWeight: "700",
		fontSize: 16,
		textTransform: "uppercase",
		letterSpacing: 2,
	},
	backButton: { position: "absolute", top: 40, left: 20, zIndex: 10 },
});

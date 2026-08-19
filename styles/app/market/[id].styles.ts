import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	backButton: {
		position: "absolute",
		top: 10,
		left: 10,
		zIndex: 10,
		backgroundColor: "rgba(255,255,255,0.9)",
		borderRadius: 20,
		padding: 6,
	},
	root: { flex: 1, backgroundColor: "#FFFFFF" },
	scrollContent: { paddingBottom: 150, marginTop: 40 },
});

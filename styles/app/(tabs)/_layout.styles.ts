import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
});

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		paddingTop: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "#E5E5E5",
	},
	tab: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
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

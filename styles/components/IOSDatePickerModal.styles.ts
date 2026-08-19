import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.35)",
	},
	sheet: {
		backgroundColor: "#fff",
	},
	toolbar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "#d0d0d0",
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#000",
	},
	cancelText: {
		color: "#8e8e93",
		fontSize: 16,
	},
	doneText: {
		color: "#007AFF",
		fontSize: 16,
		fontWeight: "600",
	},
	picker: {
		backgroundColor: "#fff",
	},
});

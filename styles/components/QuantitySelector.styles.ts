import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
	},
	button: {
		width: 30,
		height: 30,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		alignItems: "center",
		marginHorizontal: 5,
		borderRadius: 4,
	},
	disabledButton: {
		opacity: 0.5,
	},
	buttonText: {
		fontWeight: "900",
		fontSize: 18,
	},
	input: {
		width: 40,
		height: 30,
		textAlign: "center",
		borderColor: "#000000",
		borderWidth: 1,
		borderRadius: 4,
		paddingVertical: 0,
	},
});

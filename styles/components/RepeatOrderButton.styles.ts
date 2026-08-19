import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	wrapper: {
		position: "absolute",
		left: 16,
		bottom: "5%",
		zIndex: 10,
		alignItems: "flex-start",
	},
	button: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		backgroundColor: "#ffffff",
		borderRadius: 30,
		paddingVertical: 12,
		paddingHorizontal: 18,
		borderWidth: 1,
		borderColor: "#eeeeee",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.18,
		shadowRadius: 8,
		elevation: 6,
	},
	disabledButton: {
		opacity: 0.75,
	},
	buttonText: {
		color: "#222222",
		fontSize: 15,
		fontWeight: "700",
	},
});

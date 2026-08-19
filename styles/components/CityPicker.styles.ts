import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	wrapper: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 15,
		justifyContent: "center",
		overflow: "hidden",
		// Android needs height; iOS renders a compact picker inline.
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
	wrapperDisabled: {
		backgroundColor: "#f2f2f2",
		borderColor: "#ddd",
	},
	picker: {
		width: "100%",
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
});

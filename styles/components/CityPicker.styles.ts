import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	wrapper: {
		borderWidth: 1,
		borderColor: "#d1d5db",
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
		backgroundColor: "#f8f8f8",
		borderColor: "#d1d5db",
	},
	picker: {
		width: "100%",
		...Platform.select({
			android: { height: 55 },
			default: {},
		}),
	},
});

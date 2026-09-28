import { StyleSheet } from "react-native";

/** Height of one suggestion — the exact distance each slide travels. */
export const SEARCH_PLACEHOLDER_LINE_HEIGHT = 18;

export const styles = StyleSheet.create({
	// Lies on top of the search input; taps pass straight through to it.
	// Offsets leave room for the search icon (left) and mic button (right)
	// that sit inside the header's search bar.
	wrapper: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		paddingLeft: 44,
		paddingRight: 48,
	},
	// One line tall and clipped, so only the current suggestion is visible.
	lineBox: {
		height: SEARCH_PLACEHOLDER_LINE_HEIGHT,
		overflow: "hidden",
	},
	line: {
		height: SEARCH_PLACEHOLDER_LINE_HEIGHT,
		fontSize: 14,
		lineHeight: SEARCH_PLACEHOLDER_LINE_HEIGHT,
		color: "#9CA3AF",
	},
});

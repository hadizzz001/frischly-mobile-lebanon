import { StyleSheet } from "react-native";

/** Height of one suggestion — the exact distance each slide travels. */
export const SEARCH_PLACEHOLDER_LINE_HEIGHT = 18;

// Room for what sits inside the header's search bar on either side of the
// text: the search icon (16 padding + 20 icon + 8 gap) and the mic button
// (6 inset + 36 circle + 8 gap). Swapped in Arabic, where the bar is mirrored.
const SEARCH_ICON_SPACE = 44;
const MIC_SPACE = 50;

export const styles = StyleSheet.create({
	// Lies on top of the search input; taps pass straight through to it.
	wrapper: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "center",
		paddingLeft: SEARCH_ICON_SPACE,
		paddingRight: MIC_SPACE,
	},
	wrapperRTL: {
		paddingLeft: MIC_SPACE,
		paddingRight: SEARCH_ICON_SPACE,
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
	lineRTL: { textAlign: "right", writingDirection: "rtl" },
});

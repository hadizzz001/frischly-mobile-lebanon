import { StyleSheet } from "react-native";

import { MARQUEE_GAP } from "@/constants/layout";

export const styles = StyleSheet.create({
	viewport: { flex: 1, overflow: "hidden", justifyContent: "center" },
	// Sizes to its content (both copies) instead of being clipped to the parent.
	row: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
	// flexShrink: 0 stops the row's width from squeezing the copies together.
	text: { flexShrink: 0 },
	gap: { width: MARQUEE_GAP },
});

import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	// The clip (or the static logo fallback) fills whatever box the caller sized.
	fill: { width: "100%", height: "100%" },
	// Edge fades drawn over the clip.
	overlay: { ...StyleSheet.absoluteFillObject },
});

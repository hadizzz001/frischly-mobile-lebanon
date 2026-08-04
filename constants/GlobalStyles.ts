import { StyleSheet } from "react-native";

/**
 * Centralized/shared style definitions used across the whole app.
 * This is the React Native equivalent of a "global CSS file": since RN has
 * no DOM/CSS engine, styling is done via StyleSheet objects instead of
 * CSS classes. Put here any style rule that either:
 *   - is reused by more than one component/screen, or
 *   - was previously written inline as `style={{ ... }}` in JSX.
 *
 * Component-specific, single-use styles should stay in that component's
 * own local `StyleSheet.create({...})`, not here.
 */
export const globalStyles = StyleSheet.create({
	flex1: { flex: 1 },
	centerContent: { justifyContent: "center", alignItems: "center" },
	whiteBg: { backgroundColor: "#FFFFFF" },
	lightGrayBg: { backgroundColor: "#f8f8f8" },
	grow: { flexGrow: 1 },
	paddingHorizontal10: { paddingHorizontal: 10 },
	size200: { width: 200, height: 200 },
	size20: { width: 20, height: 20 },
	marginRight10: { marginRight: 10 },
	whiteBoldText18: { color: "#ffffff", fontWeight: "bold", fontSize: 18 },
	padding15: { padding: 15 },
});

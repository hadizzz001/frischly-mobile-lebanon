// utils/rtl.ts
//
// Layout helpers for Arabic. The app mirrors its layout by hand (it does NOT
// use I18nManager.forceRTL, which flips every flexDirection and left/right
// app-wide and needs a native reload). Text alignment is global: in Arabic
// every Text/TextInput defaults to right-aligned text — see utils/rtlText/,
// which metro.config.js hands to the app's own code.

import { StyleSheet } from "react-native";

// ---- Shared layout helpers ----
//
// The global right alignment only has a visible effect when a Text actually
// fills the available width. Inside a
// `flexDirection: 'row'` container the Text is sized to its content, so the
// row itself has to be reversed instead. These helpers are used by section
// headers, list rows and label/value rows across the app.

export const rtlStyles = StyleSheet.create({
	// Reverse a `flexDirection: 'row'` container so its children read
	// right-to-left (section headers, label/value rows, icon+text pills, ...).
	rowReverse: {
		flexDirection: "row-reverse",
	},
	// Push a content-sized element (e.g. a title inside a row/column that
	// doesn't stretch) to the right edge.
	alignRight: {
		alignSelf: "flex-end",
	},
	// Explicit right text alignment for cases that set their own textAlign
	// (e.g. `textAlign: 'center'`) and therefore override the global default.
	textRight: {
		textAlign: "right",
	},
	// Horizontal mirror. Applied to a horizontal ScrollView AND to each of its
	// items, it makes the row start at the right edge and scroll leftwards
	// (the same trick FlatList's `inverted` uses), while the items themselves
	// still read normally. Scroll offsets keep their meaning, so snapping and
	// auto-advance code is unchanged.
	flipX: {
		transform: [{ scaleX: -1 }],
	},
});

/**
 * Convenience: returns the row-reverse style when Arabic (RTL) is active,
 * otherwise null. Usage: `style={[styles.header, rtlRow(isRTL)]}`
 */
export const rtlRow = (isRTL: boolean) => (isRTL ? rtlStyles.rowReverse : null);

/**
 * Convenience: right-aligns a content-sized element when RTL is active.
 */
export const rtlAlign = (isRTL: boolean) => (isRTL ? rtlStyles.alignRight : null);

/**
 * Convenience: forces right text alignment when RTL is active (use for Text
 * that sets its own textAlign and thus overrides the global default).
 */
export const rtlText = (isRTL: boolean) => (isRTL ? rtlStyles.textRight : null);

/**
 * Convenience: mirrors a horizontal scroller in Arabic so it starts at the
 * right and swipes right-to-left. Put it on the ScrollView AND on every item
 * (the items are mirrored back). FlatLists can use `inverted={isRTL}` instead.
 */
export const rtlFlip = (isRTL: boolean) => (isRTL ? rtlStyles.flipX : null);

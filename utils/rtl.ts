// utils/rtl.ts
//
// Lightweight global RTL text-alignment patch. Rather than hunting down and
// editing every single <Text>/<TextInput> across the app to add
// `textAlign: 'right'` when Arabic is active, we patch React Native's Text
// and TextInput render methods ONCE at app startup so every instance
// automatically gets a right-aligned, RTL `writingDirection` default whenever
// Arabic is the active language — while still letting any explicit
// `textAlign`/`writingDirection` set directly on a component override it
// (since the caller's own style is applied after this default).
//
// This intentionally does NOT call I18nManager.forceRTL/allowRTL: flipping
// that flag mirrors the entire layout (flexDirection, absolute `left`/`right`,
// etc.) app-wide and requires a full native reload to take effect safely,
// which risks breaking many carefully positioned dropdowns/menus that assume
// LTR layout. Text alignment (the actual ask — "the text should be right to
// left") is handled here without any of that risk.

import React from "react";
import { Text, TextInput } from "react-native";

let isRTLGlobal = false;
let patched = false;

export function setGlobalRTL(rtl: boolean): void {
	isRTLGlobal = rtl;
}

export function getGlobalRTL(): boolean {
	return isRTLGlobal;
}

// ---- Shared layout helpers ----
//
// `textAlign: 'right'` (applied globally to every Text above) only has a
// visible effect when the Text actually fills the available width. Inside a
// `flexDirection: 'row'` container the Text is sized to its content, so the
// row itself has to be reversed instead. These helpers are used by section
// headers, list rows and label/value rows across the app.

import { StyleSheet } from "react-native";

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


// Style object handed to every Text/TextInput as its default — real
// per-component styles (passed second in the array) still win.
const rtlDefaultStyle = () => ({
	textAlign: isRTLGlobal ? ("right" as const) : ("left" as const),
	writingDirection: isRTLGlobal ? ("rtl" as const) : ("ltr" as const),
});

export function patchTextComponentsForRTL(): void {
	if (patched) return;
	patched = true;

	/* eslint-disable @typescript-eslint/no-explicit-any */
	const AnyText = Text as any;
	const AnyTextInput = TextInput as any;

	const originalTextRender = AnyText.render;
	if (typeof originalTextRender === "function") {
		AnyText.render = function (...args: any[]) {
			const origin = originalTextRender.apply(this, args);
			if (!origin) return origin;
			return React.cloneElement(origin, {
				style: [rtlDefaultStyle(), origin.props.style],
			});
		};
	}

	const originalTextInputRender = AnyTextInput.render;
	if (typeof originalTextInputRender === "function") {
		AnyTextInput.render = function (...args: any[]) {
			const origin = originalTextInputRender.apply(this, args);
			if (!origin) return origin;
			return React.cloneElement(origin, {
				style: [rtlDefaultStyle(), origin.props.style],
			});
		};
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */
}

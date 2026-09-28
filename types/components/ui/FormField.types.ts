import type { ReactNode } from "react";
import type { StyleProp, TextInputProps, ViewStyle } from "react-native";

export interface FormFieldProps extends Omit<TextInputProps, "style"> {
	/** Persistent small label rendered above the input (never disappears). */
	label: string;
	/** Inline validation message shown under the input in red. */
	error?: string | null;
	/**
	 * Render the error text under the box (default). Pass false when the field
	 * sits in a row next to a button: the box still turns red, and the caller
	 * shows `error` under the whole row so the button stays aligned.
	 */
	showError?: boolean;
	/** Helper text under the input (e.g. "8 digits, e.g. 70 123456"). */
	hint?: string;
	/** Fixed prefix inside the box (e.g. "+961"). */
	prefix?: string;
	/** Trailing accessory inside the box (eye toggle, calendar icon…). */
	right?: ReactNode;
	/** Leading lucide icon inside the box. */
	left?: ReactNode;
	/** Render as a tappable field (date picker trigger) instead of an input. */
	onPressField?: () => void;
	containerStyle?: StyleProp<ViewStyle>;
	required?: boolean;
}

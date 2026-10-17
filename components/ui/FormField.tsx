import { BottomSheetTextInput, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/ui/FormField.styles";
import type { FormFieldProps } from "@/types/components/ui/FormField.types";

// Labelled text input. The label sits permanently above the box (12px, muted)
// so context never vanishes once the shopper starts typing, and validation
// errors render inline instead of in an Alert.
//
// Inside a bottom sheet the field renders the sheet library's own input: the
// sheet only rises above the keyboard for a focused BottomSheetTextInput — a
// plain TextInput left it behind the keyboard, with just the dimmed backdrop
// showing (the "dark popup" on the cancel-order reason).
//
// Arabic: the row is mirrored (a "+961" prefix sits on the right) and the
// typed value is right-aligned. The value alignment is set here explicitly
// because the sheet library's input does not get the app-wide Arabic default.
// `ltr` fields (phone numbers) skip both and look exactly as in English; only
// their label, hint and error follow the language.
export default function FormField({
	label,
	error,
	showError = true,
	hint,
	prefix,
	right,
	left,
	ltr = false,
	onPressField,
	containerStyle,
	required,
	editable = true,
	value,
	placeholder,
	...inputProps
}: FormFieldProps) {
	const { isRTL } = useTranslation();
	const [focused, setFocused] = useState(false);
	// Explicit left alignment beats the app-wide Arabic default for an ltr field.
	const valueAlign = isRTL ? (ltr ? styles.textLTR : styles.inputRTL) : null;
	const disabled = !editable && !onPressField;
	// Non-null only when rendered inside a bottom sheet.
	const inSheet = useBottomSheetInternal(true) !== null;
	const Input = inSheet ? BottomSheetTextInput : TextInput;

	const box = (
		<View
			style={[
				styles.box,
				isRTL && !ltr && styles.boxRTL,
				focused && styles.boxFocused,
				!!error && styles.boxError,
				disabled && styles.boxDisabled,
			]}
		>
			{left}
			{prefix ? (
				<>
					<Text style={styles.prefix}>{prefix}</Text>
					<View style={styles.divider} />
				</>
			) : null}
			{onPressField ? (
				<Text style={[styles.value, valueAlign, !value && styles.placeholder]} numberOfLines={1}>
					{value || placeholder}
				</Text>
			) : (
				<Input
					{...inputProps}
					value={value}
					placeholder={placeholder}
					placeholderTextColor={colors.textDisabled}
					editable={editable}
					style={[styles.input, valueAlign]}
					onFocus={(e) => {
						setFocused(true);
						inputProps.onFocus?.(e);
					}}
					onBlur={(e) => {
						setFocused(false);
						inputProps.onBlur?.(e);
					}}
				/>
			)}
			{right}
		</View>
	);

	return (
		<View style={[styles.container, containerStyle]}>
			<Text style={styles.label}>
				{label}
				{required ? <Text style={styles.required}> *</Text> : null}
			</Text>
			{onPressField ? (
				<Pressable onPress={onPressField} accessibilityRole="button">
					{box}
				</Pressable>
			) : (
				box
			)}
			{error && showError ? (
				<Text style={styles.error}>{error}</Text>
			) : hint ? (
				<Text style={styles.hint}>{hint}</Text>
			) : null}
		</View>
	);
}

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { colors } from "@/constants/theme";
import { styles } from "@/styles/components/ui/FormField.styles";
import type { FormFieldProps } from "@/types/components/ui/FormField.types";

// Labelled text input. The label sits permanently above the box (12px, muted)
// so context never vanishes once the shopper starts typing, and validation
// errors render inline instead of in an Alert.
export default function FormField({
	label,
	error,
	showError = true,
	hint,
	prefix,
	right,
	left,
	onPressField,
	containerStyle,
	required,
	editable = true,
	value,
	placeholder,
	...inputProps
}: FormFieldProps) {
	const [focused, setFocused] = useState(false);
	const disabled = !editable && !onPressField;

	const box = (
		<View
			style={[
				styles.box,
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
				<Text style={[styles.value, !value && styles.placeholder]} numberOfLines={1}>
					{value || placeholder}
				</Text>
			) : (
				<TextInput
					{...inputProps}
					value={value}
					placeholder={placeholder}
					placeholderTextColor={colors.textDisabled}
					editable={editable}
					style={styles.input}
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

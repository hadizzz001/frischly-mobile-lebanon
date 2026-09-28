import { ActivityIndicator, Pressable, Text } from "react-native";

import { colors } from "@/constants/theme";
import { styles } from "@/styles/components/ui/PrimaryButton.styles";
import type { PrimaryButtonProps } from "@/types/components/ui/PrimaryButton.types";
import { tapMedium } from "@/utils/haptics";

// The app's button. Amber is reserved for conversion points and always carries
// charcoal text (white-on-amber fails WCAG AA). Spinner matches the text colour.
export default function PrimaryButton({
	label,
	onPress,
	loading = false,
	disabled = false,
	variant = "primary",
	icon,
	style,
	textStyle,
	haptic,
}: PrimaryButtonProps) {
	const isDisabled = disabled || loading;
	const textColorStyle =
		variant === "primary"
			? styles.textPrimary
			: variant === "danger"
			? styles.textDanger
			: variant === "ghost"
			? styles.textGhost
			: styles.textSecondary;
	const spinnerColor =
		variant === "primary"
			? colors.primaryText
			: variant === "danger"
			? colors.textOnDark
			: colors.text;
	const useHaptic = haptic ?? (variant === "primary" || variant === "danger");

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: isDisabled, busy: loading }}
			disabled={isDisabled}
			onPress={() => {
				if (useHaptic) tapMedium();
				onPress?.();
			}}
			style={({ pressed }) => [
				styles.base,
				styles[variant],
				isDisabled && styles.disabled,
				pressed && !isDisabled && { opacity: 0.85 },
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator size="small" color={spinnerColor} />
			) : (
				<>
					{icon}
					<Text style={[styles.text, textColorStyle, textStyle]}>{label}</Text>
				</>
			)}
		</Pressable>
	);
}

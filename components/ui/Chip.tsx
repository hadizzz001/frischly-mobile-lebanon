import { X } from "lucide-react-native";
import { Pressable, Text } from "react-native";

import { colors, icon } from "@/constants/theme";
import { styles } from "@/styles/components/ui/Chip.styles";
import type { ChipProps } from "@/types/components/ui/Chip.types";
import { tapSelection } from "@/utils/haptics";

/** Selectable pill — filter options, voice command suggestions, address tags.
 *  Amber only while selected; neutral otherwise. Haptic tick on toggle. */
export default function Chip({
	label,
	selected = false,
	onPress,
	icon: leading,
	onRemove,
	disabled,
	style,
}: ChipProps) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ selected, disabled }}
			disabled={disabled}
			onPress={() => {
				tapSelection();
				onPress?.();
			}}
			style={({ pressed }) => [
				styles.chip,
				selected && styles.chipSelected,
				disabled && styles.chipDisabled,
				pressed && { opacity: 0.8 },
				style,
			]}
		>
			{leading}
			<Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
				{label}
			</Text>
			{onRemove ? (
				<Pressable onPress={onRemove} hitSlop={8} style={styles.remove}>
					<X
						size={icon.sizeSmall}
						strokeWidth={icon.strokeWidth}
						color={selected ? colors.primaryText : colors.textMuted}
					/>
				</Pressable>
			) : null}
		</Pressable>
	);
}

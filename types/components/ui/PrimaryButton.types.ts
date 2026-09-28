import type { ReactNode } from "react";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";

export interface PrimaryButtonProps {
	label: string;
	onPress?: () => void | Promise<void>;
	loading?: boolean;
	disabled?: boolean;
	/** primary = amber; secondary = neutral; danger = red; ghost = text only. */
	variant?: "primary" | "secondary" | "danger" | "ghost";
	icon?: ReactNode;
	style?: StyleProp<ViewStyle>;
	textStyle?: StyleProp<TextStyle>;
	/** Medium haptic on press (default true for primary/danger). */
	haptic?: boolean;
}

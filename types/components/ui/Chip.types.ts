import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export interface ChipProps {
	label: string;
	selected?: boolean;
	onPress?: () => void;
	/** Small lucide icon rendered before the label. */
	icon?: ReactNode;
	/** Show an "x" affordance after the label (e.g. removable search terms). */
	onRemove?: () => void;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}

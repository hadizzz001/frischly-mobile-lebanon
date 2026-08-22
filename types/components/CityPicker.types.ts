import type { StyleProp, ViewStyle } from "react-native";

export interface CityPickerProps {
	value?: string;
	onValueChange: (city: string) => void;
	placeholder?: string;
	textColor?: string;
	style?: StyleProp<ViewStyle>;
	disabled?: boolean;
}

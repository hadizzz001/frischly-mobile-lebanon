import type { KeyboardTypeOptions } from "react-native";

export interface InputBoxProps {
	placeholder?: string;
	value?: string;
	onChangeText?: (text: string) => void;
	secureTextEntry?: boolean;
	keyboardType?: KeyboardTypeOptions;
	inputBg?: string;
	inputText?: string;
	placeholderColor?: string;
	editable?: boolean;
	[key: string]: unknown;
}

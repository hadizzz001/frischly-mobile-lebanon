import type {
    StyleProp,
    TouchableOpacityProps,
    ViewStyle,
} from "react-native";

export interface LoadingButtonProps
	extends Omit<TouchableOpacityProps, "onPress"> {
	// Can be sync or async. The button shows a spinner while this is pending
	// and restores itself once it resolves or rejects (success or error).
	onPress: () => void | Promise<any>;
	loadingColor?: string;
	indicatorSize?: "small" | "large";
	// Extra style applied only while the spinner is shown (defaults to style).
	loadingStyle?: StyleProp<ViewStyle>;
}

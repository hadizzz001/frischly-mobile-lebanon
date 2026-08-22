import type { StyleProp, ViewStyle } from "react-native";

export interface StarRatingProps {
	rating?: number;
	onChange?: (value: number) => void;
	size?: number;
	color?: string;
	emptyColor?: string;
	style?: StyleProp<ViewStyle>;
}

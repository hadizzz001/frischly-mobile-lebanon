import type { StyleProp, ViewStyle } from "react-native";

export interface SkeletonProps {
	width?: number | `${number}%`;
	height?: number;
	borderRadius?: number;
	style?: StyleProp<ViewStyle>;
}

export interface ProductGridSkeletonProps {
	/** Number of placeholder cards. Defaults to 6 (three rows of two). */
	count?: number;
	/** Card width — defaults to the 2-per-row grid width. */
	cardWidth?: number;
	/** Horizontal (carousel) layout instead of a wrapped grid. */
	horizontal?: boolean;
}

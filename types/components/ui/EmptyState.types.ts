import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

export interface EmptyStateProps {
	title: string;
	description?: string;
	/** 140x140 illustration; defaults to the empty-basket SVG. */
	illustration?: ReactNode | "basket" | "pin" | "bell" | "search";
	actionLabel?: string;
	onAction?: () => void;
	secondaryLabel?: string;
	onSecondary?: () => void;
	style?: StyleProp<ViewStyle>;
}

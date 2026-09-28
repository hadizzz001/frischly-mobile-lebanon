import type { StyleProp, ViewStyle } from "react-native";

import type { Product } from "@/types";

export interface ProductCardProps {
	product: Product;
	/** Card width. Defaults to the 3-per-row grid width. */
	width?: number;
	/** Height of the image box. Defaults to a square-ish 120. */
	imageHeight?: number;
	/** Tap handler. Defaults to opening /product/[id]. */
	onPress?: () => void;
	/** Hide the +/- and add-to-cart control (e.g. read-only listings). */
	showCartControls?: boolean;
	style?: StyleProp<ViewStyle>;
}

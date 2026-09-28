import type { StyleProp, TextStyle } from "react-native";

export interface MarqueeProps {
	/** The (already translated) line to scroll. */
	text: string;
	/** Font/colour for the scrolling text. */
	style?: StyleProp<TextStyle>;
	/** Scroll to the right instead of the left (RTL languages). */
	reverse?: boolean;
}

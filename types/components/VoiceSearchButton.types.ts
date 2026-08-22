import type { StyleProp, ViewStyle } from "react-native";

export interface VoiceResult {
	transcript?: string;
	terms?: string[];
	intent?: string;
	market?: string;
}

export interface VoiceSearchButtonProps {
	onResults?: (result: VoiceResult) => void;
	/**
	 * @deprecated No longer used. The spoken language is auto-detected by the AI
	 * (English / Arabic / Lebanese dialect, including code-switching), so it is
	 * never pinned to the UI language. Kept so existing callers don't break.
	 */
	language?: string;
	floating?: boolean;
	size?: number;
	color?: string;
	style?: StyleProp<ViewStyle>;
}

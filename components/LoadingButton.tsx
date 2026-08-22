import { useState } from "react";
import {
    ActivityIndicator,
    TouchableOpacity,
} from "react-native";

import type { LoadingButtonProps } from "@/types/components/LoadingButton.types";

/**
 * Drop-in replacement for TouchableOpacity that swaps its content for an
 * ActivityIndicator while the onPress handler is running, and disables
 * itself so it can't be tapped again mid-request. Once the promise settles
 * (whether it resolves or throws), the original content is shown again.
 */
export default function LoadingButton({
	onPress,
	style,
	loadingStyle,
	children,
	disabled,
	loadingColor = "#fff",
	indicatorSize = "small",
	...rest
}: LoadingButtonProps) {
	const [loading, setLoading] = useState(false);

	const handlePress = async () => {
		if (loading) return;
		setLoading(true);
		try {
			await onPress();
		} finally {
			setLoading(false);
		}
	};

	return (
		<TouchableOpacity
			{...rest}
			style={loading ? [style, loadingStyle] : style}
			disabled={disabled || loading}
			onPress={handlePress}
			activeOpacity={0.85}
		>
			{loading ? (
				<ActivityIndicator size={indicatorSize} color={loadingColor} />
			) : (
				children
			)}
		</TouchableOpacity>
	);
}

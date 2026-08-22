import { Text } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";
import { styles } from "@/styles/components/ThemedText.styles";

import type { ThemedTextProps } from "@/types/components/ThemedText.types";

export type { ThemedTextProps };

export function ThemedText({
	style,
	lightColor,
	darkColor,
	type = "default",
	...rest
}: ThemedTextProps) {
	const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

	return (
		<Text
			style={[
				{ color },
				type === "default" ? styles.default : undefined,
				type === "title" ? styles.title : undefined,
				type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
				type === "subtitle" ? styles.subtitle : undefined,
				type === "link" ? styles.link : undefined,
				style,
			]}
			{...rest}
		/>
	);
}

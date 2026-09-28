import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";

import { colors, hitSize, icon, radius } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";

// Back chevron that mirrors in Arabic: "back" points toward the screen edge
// the previous page slides in from, so in RTL it must point right.
export default function BackButton({
	onPress,
	style,
	color = colors.text,
}: {
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
	color?: string;
}) {
	const router = useRouter();
	const { isRTL } = useTranslation();
	const Chevron = isRTL ? ChevronRight : ChevronLeft;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Back"
			hitSlop={8}
			onPress={onPress ?? (() => router.back())}
			style={({ pressed }) => [
				{
					width: hitSize,
					height: hitSize,
					borderRadius: radius.full,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: pressed ? colors.surfaceAlt : "transparent",
				},
				style,
			]}
		>
			<Chevron size={icon.sizeLarge} strokeWidth={icon.strokeWidth} color={color} />
		</Pressable>
	);
}

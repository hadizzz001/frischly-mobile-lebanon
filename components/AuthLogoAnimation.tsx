import { Image } from "expo-image";
import { View } from "react-native";

import { AUTH_LOGO_ANIMATION } from "@/constants/brand";
import { styles } from "@/styles/components/AuthLogoAnimation.styles";
import type { AuthLogoAnimationProps } from "@/types/components/AuthLogoAnimation.types";

/**
 * Animated logo used on the login/register screens. The bundled animated WebP
 * carries its own timing (the rest pose held for 2 s, the drive-by, the loop),
 * so it plays the moment the screen appears: no download, no video player, no
 * timers.
 *
 * `useAppleWebpCodec={false}` decodes it with libwebp on iOS. Apple's own WebP
 * decoder (expo-image's default) can composite animated WebP frames wrongly and
 * at the wrong pace on older iOS versions.
 */
export default function AuthLogoAnimation({ style }: AuthLogoAnimationProps) {
	return (
		<View style={style} pointerEvents="none">
			<Image source={AUTH_LOGO_ANIMATION} style={styles.fill} contentFit="contain" useAppleWebpCodec={false} />
		</View>
	);
}

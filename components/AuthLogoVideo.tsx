import { useEvent, useEventListener } from "expo";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

import {
	AUTH_LOGO_VIDEO_BACKGROUND,
	AUTH_LOGO_VIDEO_URL as LOGO_VIDEO_URL,
	LOGO_TRANSPARENT_URL,
} from "@/constants/brand";
import { AUTH_LOGO_HOLD_MS as HOLD_MS } from "@/constants/timing";
import { styles } from "@/styles/components/AuthLogoVideo.styles";
import type { AuthLogoVideoProps } from "@/types/components/AuthLogoVideo.types";

// Thin fades along the clip's edges, from the header's yellow to transparent,
// in percent of the clip's size. They stay inside the clip's empty margin (the
// artwork spans roughly 7–95% across and 25–80% down), and melt the square
// into the header whatever tone the device's decoder gives its background —
// which also starts a shade lighter than it ends.
const EDGE_FADES = [
	{ id: "top", gradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, rect: { x: 0, y: 0, width: 100, height: 6 } },
	{ id: "bottom", gradient: { x1: 0, y1: 1, x2: 0, y2: 0 }, rect: { x: 0, y: 94, width: 100, height: 6 } },
	{ id: "left", gradient: { x1: 0, y1: 0, x2: 1, y2: 0 }, rect: { x: 0, y: 0, width: 4.5, height: 100 } },
	{ id: "right", gradient: { x1: 1, y1: 0, x2: 0, y2: 0 }, rect: { x: 95.5, y: 0, width: 4.5, height: 100 } },
] as const;

function EdgeFade() {
	return (
		<Svg style={styles.overlay} viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
			<Defs>
				{EDGE_FADES.map((fade) => (
					<LinearGradient key={fade.id} id={`authLogoFade-${fade.id}`} {...fade.gradient}>
						<Stop offset="0" stopColor={AUTH_LOGO_VIDEO_BACKGROUND} stopOpacity={1} />
						<Stop offset="1" stopColor={AUTH_LOGO_VIDEO_BACKGROUND} stopOpacity={0} />
					</LinearGradient>
				))}
			</Defs>
			{EDGE_FADES.map((fade) => (
				<Rect key={fade.id} {...fade.rect} fill={`url(#authLogoFade-${fade.id})`} />
			))}
		</Svg>
	);
}

/**
 * Animated logo used on the login/register screens. Plays a short branded
 * video clip, holding for `HOLD_MS` before it starts, and again every time it
 * reaches the end before looping. The clip is cached on disk after the first
 * load; if it can't be played at all the static logo is shown instead.
 */
export default function AuthLogoVideo({ style }: AuthLogoVideoProps) {
	const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const player = useVideoPlayer({ uri: LOGO_VIDEO_URL, useCaching: true }, (p) => {
		p.loop = false;
		p.muted = true;
	});
	const { status } = useEvent(player, "statusChange", { status: player.status });

	// Hold on the first frame for HOLD_MS before starting playback, instead of
	// autoplaying the instant the screen mounts.
	useEffect(() => {
		holdTimeout.current = setTimeout(() => {
			player.play();
		}, HOLD_MS);

		return () => {
			if (holdTimeout.current) clearTimeout(holdTimeout.current);
		};
	}, [player]);

	// Every time the clip plays to the end, wait HOLD_MS again before seeking
	// back to the start and replaying it.
	useEventListener(player, "playToEnd", () => {
		if (holdTimeout.current) clearTimeout(holdTimeout.current);
		holdTimeout.current = setTimeout(() => {
			player.currentTime = 0;
			player.play();
		}, HOLD_MS);
	});

	return (
		<View style={style} pointerEvents="none">
			{status === "error" ? (
				<Image source={{ uri: LOGO_TRANSPARENT_URL }} style={styles.fill} contentFit="contain" cachePolicy="memory-disk" />
			) : (
				<>
					<VideoView
						player={player}
						style={styles.fill}
						contentFit="contain"
						nativeControls={false}
						allowsFullscreen={false}
						allowsPictureInPicture={false}
					/>
					<EdgeFade />
				</>
			)}
		</View>
	);
}

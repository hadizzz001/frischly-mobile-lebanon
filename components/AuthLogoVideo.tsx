import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";

interface AuthLogoVideoProps {
	style?: StyleProp<ViewStyle>;
}

// Branded animated logo shown on the login/register screens, replacing the
// old static PNG image.
const LOGO_VIDEO_URL =
	"https://res.cloudinary.com/dxefurewd/video/upload/q_auto,f_auto,w_1280,h_720,c_limit/v1783356666/kling_20260707_VIDEO_animate_fa_73_0_online-video-cutter.com_1_uxqfdj.mp4";

// How long (ms) to hold before the very first playback starts, and how long
// to pause again every time the clip finishes before it repeats — so it
// doesn't loop back-to-back with no breathing room.
const HOLD_MS = 2000;

/**
 * Animated logo used on the login/register screens. Plays a short branded
 * video clip, holding for `HOLD_MS` before it starts, and again every time it
 * reaches the end before looping.
 */
export default function AuthLogoVideo({ style }: AuthLogoVideoProps) {
	const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const player = useVideoPlayer(LOGO_VIDEO_URL, (p) => {
		p.loop = false;
		p.muted = true;
	});

	// Hold on the first frame for HOLD_MS before starting playback, instead of
	// autoplaying the instant the screen mounts.
	useEffect(() => {
		holdTimeout.current = setTimeout(() => {
			player.play();
		}, HOLD_MS);

		return () => {
			if (holdTimeout.current) clearTimeout(holdTimeout.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
		<VideoView
			player={player}
			style={style}
			contentFit="contain"
			nativeControls={false}
			allowsFullscreen={false}
			allowsPictureInPicture={false}
			pointerEvents="none"
		/>
	);
}

import { useEventListener } from "expo";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useRef } from "react";

import { AUTH_LOGO_VIDEO_URL as LOGO_VIDEO_URL } from "@/constants/brand";
import { AUTH_LOGO_HOLD_MS as HOLD_MS } from "@/constants/timing";
import type { AuthLogoVideoProps } from "@/types/components/AuthLogoVideo.types";

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

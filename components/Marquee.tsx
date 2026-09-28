import { MARQUEE_GAP } from "@/constants/layout";
import { TICKER_MS_PER_PIXEL } from "@/constants/timing";
import { styles } from "@/styles/components/Marquee.styles";
import type { MarqueeProps } from "@/types/components/Marquee.types";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

// A seamless, never-pausing marquee.
//
// The text is rendered TWICE, one copy behind the other with a fixed gap. The
// row slides left by exactly one copy + gap and then snaps back to zero — at
// which point the second copy sits precisely where the first one started, so
// the jump is invisible and the strip never runs empty. `Easing.linear` keeps
// it at one speed; the duration is derived from the width, so longer text
// scrolls for longer rather than faster.
//
// The loop is a Reanimated `withRepeat` that lives entirely on the UI thread:
// it does not need JS timers, an end-callback round-trip, or the RN Animated
// native-driver queue, so a busy JS thread, a re-render of the ticker (e.g. a
// translation landing) or a Fast Refresh remount can't stall it. It is also
// restarted from scratch whenever the text/width changes.
export default function Marquee({ text, style, reverse = false }: MarqueeProps) {
	const [width, setWidth] = useState(0);
	const offset = useSharedValue(0);

	useEffect(() => {
		if (!width) return;

		const distance = width + MARQUEE_GAP;
		const from = reverse ? -distance : 0;
		const to = reverse ? 0 : -distance;

		cancelAnimation(offset);
		offset.value = from;
		offset.value = withRepeat(
			withTiming(to, {
				duration: distance * TICKER_MS_PER_PIXEL,
				easing: Easing.linear,
				// Scrolling is the only way the whole line can be read, so it
				// keeps moving even with the OS "reduce animations" setting on
				// (which would otherwise snap it to the end and look frozen).
				reduceMotion: ReduceMotion.Never,
			}),
			-1,
			false,
			undefined,
			ReduceMotion.Never,
		);

		return () => {
			cancelAnimation(offset);
		};
	}, [width, text, reverse, offset]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: offset.value }],
	}));

	return (
		<View style={styles.viewport}>
			<Animated.View style={[styles.row, animatedStyle]}>
				<Text
					numberOfLines={1}
					style={[styles.text, style]}
					onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
				>
					{text}
				</Text>
				<View style={styles.gap} />
				<Text numberOfLines={1} style={[styles.text, style]}>
					{text}
				</Text>
				<View style={styles.gap} />
			</Animated.View>
		</View>
	);
}

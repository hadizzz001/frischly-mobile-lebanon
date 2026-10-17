import { SEARCH_SUGGESTIONS } from "@/constants/search";
import {
	SEARCH_PLACEHOLDER_HOLD_MS,
	SEARCH_PLACEHOLDER_SLIDE_MS,
} from "@/constants/timing";
import { useTranslation } from "@/contexts/TranslationContext";
import {
	SEARCH_PLACEHOLDER_LINE_HEIGHT as LINE,
	styles,
} from "@/styles/components/SearchPlaceholder.styles";
import type { SearchPlaceholderProps } from "@/types/components/SearchPlaceholder.types";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";

// The search field's placeholder as a vertical ticker: "Search 'Cake'" rides up
// and out while the next suggestion follows it in.
//
// Every suggestion is rendered once, stacked in a column, and only the column
// is animated — nothing re-renders as it moves, which is what keeps it smooth.
// The first suggestion is repeated at the BOTTOM of the stack: when the column
// reaches that copy it is snapped back to the top, and since the two look
// identical the wrap cannot be seen.
//
// The whole cycle (hold, slide, hold, slide, …, snap back) is ONE Reanimated
// sequence repeated forever on the UI thread. The previous version chained
// `setTimeout` → `Animated.timing` → completion callback → next step, and a
// single missed callback (app backgrounded mid-slide, JS thread busy, Fast
// Refresh) left it stuck on one word for good.
//
// A real TextInput placeholder cannot animate, so this is drawn on top of the
// field (pointer events off, so taps still reach the input) and hidden as soon
// as the shopper types.
export default function SearchPlaceholder({ visible = true }: SearchPlaceholderProps) {
	const { t, td, isRTL } = useTranslation();
	const offset = useSharedValue(0);

	const count = SEARCH_SUGGESTIONS.length;

	useEffect(() => {
		if (!visible || count < 2) return;

		// One "hold, then slide up one line" step per suggestion, ending on the
		// repeated first line, then an instant snap back to the real one.
		const steps = Array.from({ length: count }, (_, i) =>
			withDelay(
				SEARCH_PLACEHOLDER_HOLD_MS,
				withTiming(-(i + 1) * LINE, {
					duration: SEARCH_PLACEHOLDER_SLIDE_MS,
					easing: Easing.inOut(Easing.cubic),
					reduceMotion: ReduceMotion.Never,
				}),
				ReduceMotion.Never,
			),
		);

		cancelAnimation(offset);
		offset.value = 0;
		offset.value = withRepeat(
			withSequence(
				ReduceMotion.Never,
				...steps,
				withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }),
			),
			-1,
			false,
			undefined,
			ReduceMotion.Never,
		);

		return () => {
			cancelAnimation(offset);
			offset.value = 0;
		};
	}, [visible, count, offset]);

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: offset.value }],
	}));

	if (!visible) return null;

	const label = (term: string) => `${t("searchFor")} '${td(term)}'`;
	// The trailing copy of the first suggestion is what makes the loop seamless.
	const lines = [...SEARCH_SUGGESTIONS, SEARCH_SUGGESTIONS[0]];

	return (
		<View pointerEvents="none" style={[styles.wrapper, isRTL && styles.wrapperRTL]}>
			<View style={styles.lineBox}>
				<Animated.View style={animatedStyle}>
					{lines.map((term, position) => (
						<Text
							key={`${term}-${position}`}
							numberOfLines={1}
							style={[styles.line, isRTL && styles.lineRTL]}
						>
							{label(term)}
						</Text>
					))}
				</Animated.View>
			</View>
		</View>
	);
}

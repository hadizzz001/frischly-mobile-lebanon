import CatalogImage from "@/components/ui/CatalogImage";
import { SECTION_TITLE_ICON_COLOR, SECTION_TITLE_ICON_SIZE } from "@/constants/navigation";
import { Store } from "lucide-react-native";
import { MARKETS_SLIDER_SNAP_INTERVAL as SNAP_INTERVAL } from "@/constants/layout";
import {
	MARKETS_SLIDER_STEP_DURATION_MS as STEP_DURATION,
	MARKETS_SLIDER_STEP_PAUSE_MS as STEP_PAUSE,
} from "@/constants/timing";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/MarketsSlider.styles";
import type { Market } from "@/types";
import type { MarketsSliderProps } from "@/types/components/MarketsSlider.types";
import { LOGO_TILE_TRANSFORMATION } from "@/utils/cloudinary";
import { rtlFlip, rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
import { fetchVisibleMarkets } from "@/utils/visibleMarkets";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MarketsSlider({
	refreshTrigger,
	onContent,
	hideLoader,
}: MarketsSliderProps) {
	const { t, isRTL } = useTranslation();
	const router = useRouter();

	const [markets, setMarkets] = useState<Market[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	// Auto-slide + manual scroll state. Auto-advance is driven with scrollTo on
	// a timer, and it pauses while the user is dragging the row.
	const scrollRef = useRef<ScrollView>(null);
	const offsetRef = useRef<number>(0);
	const indexRef = useRef<number>(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pausedRef = useRef<boolean>(false);

	const fetchMarkets = async () => {
		try {
			setLoading(true);
			// The logged-in user's city and exact map pin (guests have neither),
			// read in a single /api/auth/me round-trip so both values agree.
			const { city, pin } = await getUserCityAndPin();
			setMarkets(await fetchVisibleMarkets(city, pin));
		} catch (err) {
			console.error("MarketsSlider fetch error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMarkets();
	}, []);

	useEffect(() => {
		if ((refreshTrigger ?? 0) > 0) fetchMarkets();
	}, [refreshTrigger]);

	// Drive the auto-slider: move exactly one market per step, then pause.
	// Uses scrollTo so the same row stays draggable by hand.
	useEffect(() => {
		if (timerRef.current) clearTimeout(timerRef.current);
		if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
		timerRef.current = null;
		resumeTimerRef.current = null;
		indexRef.current = 0;
		offsetRef.current = 0;
		pausedRef.current = false;
		scrollRef.current?.scrollTo({ x: 0, animated: false });

		// Only auto-slide when there are more markets than fit on screen.
		if (markets.length <= 3) {
			return;
		}

		const total = markets.length;
		let cancelled = false;

		const step = () => {
			if (cancelled) return;
			// Hold off while the user is interacting with the slider.
			if (pausedRef.current) {
				timerRef.current = setTimeout(step, STEP_PAUSE);
				return;
			}

			const next = indexRef.current + 1;
			scrollRef.current?.scrollTo({
				x: next * SNAP_INTERVAL,
				animated: true,
			});
			indexRef.current = next;

			if (next >= total) {
				// We render two copies of the list. Once we've scrolled past the
				// first copy, jump back to the start invisibly for a seamless loop
				// (skipped if the user grabbed the row mid-step).
				timerRef.current = setTimeout(() => {
					if (cancelled) return;
					if (!pausedRef.current) {
						indexRef.current = 0;
						offsetRef.current = 0;
						scrollRef.current?.scrollTo({ x: 0, animated: false });
					}
					timerRef.current = setTimeout(step, STEP_PAUSE);
				}, STEP_DURATION + 60);
			} else {
				timerRef.current = setTimeout(step, STEP_PAUSE);
			}
		};

		timerRef.current = setTimeout(step, STEP_PAUSE);

		return () => {
			cancelled = true;
			if (timerRef.current) clearTimeout(timerRef.current);
			if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
			timerRef.current = null;
			resumeTimerRef.current = null;
		};
	}, [markets]);

	// Keep the current offset in sync (used to resume auto-slide and to wrap
	// the infinite loop after a manual drag).
	const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		offsetRef.current = e.nativeEvent.contentOffset.x;
	};

	// After a manual drag settles: wrap the offset back into the first copy and
	// resume the auto-slide from wherever the user left it.
	const settle = () => {
		if (!pausedRef.current) return; // ignore programmatic auto-scroll
		if (resumeTimerRef.current) {
			clearTimeout(resumeTimerRef.current);
			resumeTimerRef.current = null;
		}
		if (markets.length > 3) {
			const oneCopy = markets.length * SNAP_INTERVAL;
			let x = offsetRef.current;
			if (x >= oneCopy) x -= oneCopy;
			else if (x < 0) x += oneCopy;
			if (x !== offsetRef.current) {
				offsetRef.current = x;
				scrollRef.current?.scrollTo({ x, animated: false });
			}
			indexRef.current = Math.round(x / SNAP_INTERVAL);
		}
		pausedRef.current = false;
	};

	const handleBeginDrag = () => {
		pausedRef.current = true;
		if (resumeTimerRef.current) {
			clearTimeout(resumeTimerRef.current);
			resumeTimerRef.current = null;
		}
	};

	const handleEndDrag = () => {
		// If the release has no momentum, resume shortly after the drag ends.
		if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
		resumeTimerRef.current = setTimeout(settle, 150);
	};

	const handleMomentumBegin = () => {
		if (resumeTimerRef.current) {
			clearTimeout(resumeTimerRef.current);
			resumeTimerRef.current = null;
		}
	};

	const handleMomentumEnd = () => {
		settle();
	};

	// Tell the home screen whether this section ended up with content.
	useEffect(() => {
		if (!loading) onContent?.(markets.length > 0);
	}, [loading, markets, onContent]);

	if (loading) {
		if (hideLoader) return null;
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#F59E0B" />
			</View>
		);
	}

	if (!markets.length) {
		return null;
	}

	const renderMarket = (market: Market, index: number) => (
		<TouchableOpacity
			key={`${market._id}-${index}`}
			activeOpacity={0.8}
			style={[styles.card, rtlFlip(isRTL)]}
			onPress={() =>
				router.push(
					`/market/${market._id}?marketName=${encodeURIComponent(
						market.name || ""
					)}`
				)
			}
		>
			{/* Every logo is re-centred on a 5:4 tile of its own background
			    colour with an even margin (see utils/cloudinary.ts), so square,
			    wide, white, black or transparent logos all fill the same frame
			    instead of floating in it at odd sizes. */}
			<View style={styles.imageWrapper}>
				{market.logo ? (
					<CatalogImage
						uri={market.logo}
						transformation={LOGO_TILE_TRANSFORMATION}
						style={styles.image}
						contentFit="contain"
						cachePolicy="memory-disk"
						transition={150}
						recyclingKey={String(market._id)}
					/>
				) : (
					<Text style={styles.placeholder}>
						{(market.name || "?").charAt(0).toUpperCase()}
					</Text>
				)}
			</View>
		</TouchableOpacity>
	);

	// Duplicate the list so the loop reset is invisible (seamless).
	const loopData = markets.length > 3 ? [...markets, ...markets] : markets;

	return (
		<View style={styles.container}>
			<View style={[styles.header, rtlRow(isRTL)]}>
				<View style={[styles.headerTitleRow, rtlRow(isRTL)]}>
					<Text style={styles.headerText}>
						{t("markets") || "Markets"}
					</Text>
					<Store
						size={SECTION_TITLE_ICON_SIZE}
						color={SECTION_TITLE_ICON_COLOR}
					/>
				</View>
			</View>

			<View style={styles.viewport}>
				{/* Mirrored in Arabic: starts at the right edge and advances
				    right-to-left, with the same offsets and snapping. */}
				<ScrollView
					ref={scrollRef}
					horizontal
					style={rtlFlip(isRTL)}
					showsHorizontalScrollIndicator={false}
					snapToInterval={SNAP_INTERVAL}
					decelerationRate="fast"
					disableIntervalMomentum
					scrollEventThrottle={16}
					onScroll={handleScroll}
					onScrollBeginDrag={handleBeginDrag}
					onScrollEndDrag={handleEndDrag}
					onMomentumScrollBegin={handleMomentumBegin}
					onMomentumScrollEnd={handleMomentumEnd}
					contentContainerStyle={styles.track}
				>
					{loopData.map((market, index) => renderMarket(market, index))}
				</ScrollView>
			</View>
		</View>
	);
}

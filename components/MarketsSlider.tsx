import { useTranslation } from "@/contexts/TranslationContext";
import { MarketService, ProductService } from "@/services/api";
import { styles } from "@/styles/components/MarketsSlider.styles";
import type { Market } from "@/types";
import type { MarketsSliderProps } from "@/types/components/MarketsSlider.types";
import { entityVisibleForCityOrPin } from "@/utils/cityVisibility";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
// Keep ~3 markets visible while sliding one card at a time.
const ITEM_SPACING = 10;
const ITEM_WIDTH = width / 3 - 16;
const SNAP_INTERVAL = ITEM_WIDTH + ITEM_SPACING;
// Auto-slide timing (one market per step).
const STEP_DURATION = 900; // ms to move one card
const STEP_PAUSE = 3200; // ms to wait between steps

export default function MarketsSlider({ refreshTrigger }: MarketsSliderProps) {
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

			// Determine the logged-in user's city and exact map pin (guests have
			// neither) in a single /api/auth/me round-trip so both values are
			// always consistent with each other.
			const { city, pin } = await getUserCityAndPin();

			// Logged-in user with a city => markets of that city only.
			// Guest (or no city) => all markets. Passing the shopper's exact pin
			// lets the server also enforce the market's configured delivery
			// range (map pin(s)/radius, or named Zone documents) server-side —
			// this is the authoritative check since only the server can see a
			// market's private Zone documents.
			//
			// When the shopper HAS a pin we additionally ask for the pin-only
			// list (no city). A market can cover the shopper's exact pin with
			// its delivery circle while serving a different city name, and the
			// city-scoped query would never return it. Both lists are merged and
			// the final "city OR pin-in-range" rule is applied below.
			const [cityRes, pinRes] = await Promise.all([
				MarketService.listPublic(city || undefined, pin || undefined),
				pin ? MarketService.listPublic(undefined, pin) : Promise.resolve(null),
			]);

			const byId = new Map<string, Market>();
			for (const list of [cityRes?.data, pinRes?.data]) {
				if (!Array.isArray(list)) continue;
				for (const market of list) {
					if (market?._id) byId.set(String(market._id), market);
				}
			}
			const all = Array.from(byId.values());

			// A market can serve MULTIPLE cities (an array) and/or declare map-pin
			// delivery circles. It is shown when the shopper's exact pin falls
			// inside one of its circles, OR — when it has no circles / the shopper
			// has no pin — when it serves the shopper's city. Guests (no city) and
			// markets with no restriction stay visible.
			const visible = all.filter((market) => {
				const ok = entityVisibleForCityOrPin(market, city, pin);
				if (!ok && __DEV__) {
					console.log(
						`[MarketsSlider] Hiding "${market.name}" — city "${city}" not served and shopper pin`,
						pin,
						"is outside its delivery range",
						market.deliveryRegions
					);
				}
				return ok;
			});

			// Hide markets that don't have any products yet — no point showing an
			// empty market on the home page slider.
			const withItemsFlags = await Promise.all(
				visible.map(async (market) => {
					try {
						const prodRes = await ProductService.list({
							market: market._id,
							limit: 1,
						});
						return (prodRes.data || []).length > 0;
					} catch {
						// If the check fails, don't hide the market over a network hiccup.
						return true;
					}
				})
			);
			setMarkets(visible.filter((_, i) => withItemsFlags[i]));
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

	if (loading) {
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#f4bb26" />
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
			style={styles.card}
			onPress={() =>
				router.push(
					`/market/${market._id}?marketName=${encodeURIComponent(
						market.name || ""
					)}`
				)
			}
		>
			<View style={styles.imageWrapper}>
				{market.logo ? (
					<Image
						source={{ uri: market.logo }}
						style={styles.image}
						resizeMode="contain"
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
				<Text style={styles.headerText}>
					{t("markets") || "Markets"}
				</Text>
			</View>

			<View style={styles.viewport}>
				<ScrollView
					ref={scrollRef}
					horizontal
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

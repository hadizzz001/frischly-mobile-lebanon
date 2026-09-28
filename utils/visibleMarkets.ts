import { MarketService, ProductService } from "@/services/api";
import type { Market } from "@/types";
import { entityVisibleForCityOrPin } from "@/utils/cityVisibility";

type Pin = { latitude: number; longitude: number } | null | undefined;

// The markets a shopper can actually order from: the ones the home page's
// markets slider shows. Shared by MarketsSlider and the home screen, which
// opens the market straight away when Freshly LB doesn't deliver to the
// shopper and exactly one market does.
const loadVisibleMarkets = async (city: string, pin: Pin): Promise<Market[]> => {
	// Logged-in user with a city => markets of that city only. Guest (or no
	// city) => all markets. Passing the shopper's exact pin lets the server also
	// enforce the market's configured delivery range (map pin(s)/radius, or
	// named Zone documents) server-side — this is the authoritative check since
	// only the server can see a market's private Zone documents.
	//
	// When the shopper HAS a pin we additionally ask for the pin-only list (no
	// city). A market can cover the shopper's exact pin with its delivery circle
	// while serving a different city name, and the city-scoped query would
	// never return it. Both lists are merged and the final "city OR
	// pin-in-range" rule is applied below.
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
	// delivery circles. It is shown when the shopper's exact pin falls inside
	// one of its circles, OR — when it has no circles / the shopper has no pin
	// — when it serves the shopper's city. Guests (no city) and markets with no
	// restriction stay visible.
	const visible = all.filter((market) => {
		const ok = entityVisibleForCityOrPin(market, city, pin ?? null);
		if (!ok && __DEV__) {
			console.log(
				`[visibleMarkets] Hiding "${market.name}" — city "${city}" not served and shopper pin`,
				pin,
				"is outside its delivery range",
				market.deliveryRegions
			);
		}
		return ok;
	});

	// Hide markets that don't have any products yet — no point offering an
	// empty market.
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
	return visible.filter((_, i) => withItemsFlags[i]);
};

// The home screen and its markets slider ask for the same list at the same
// moment; share one request between callers that arrive within a few seconds
// for the same city + pin instead of fetching every market twice.
const SHARE_WINDOW_MS = 5000;
let last: { key: string; at: number; promise: Promise<Market[]> } | null = null;

export const fetchVisibleMarkets = (city: string, pin: Pin): Promise<Market[]> => {
	const key = `${city}|${pin ? `${pin.latitude},${pin.longitude}` : ""}`;
	if (last && last.key === key && Date.now() - last.at < SHARE_WINDOW_MS) {
		return last.promise;
	}
	const promise = loadVisibleMarkets(city, pin);
	last = { key, at: Date.now(), promise };
	// A failed request must not be handed to the next caller.
	promise.catch(() => {
		if (last?.promise === promise) last = null;
	});
	return promise;
};

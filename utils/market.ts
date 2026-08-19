// Market-related pure helpers shared by the shop/search and checkout screens.

import { pointInAnyRegion } from "@/utils/geo";

/**
 * A market's configured delivery range (map pin(s) + radius). When the
 * shopper's own map pin falls outside every one of a market's regions, that
 * market's products must be hidden from search too — otherwise a market that
 * is correctly hidden from the home slider/browse view would still leak its
 * items into search results, which is confusing and inconsistent.
 */
export const marketInDeliveryRange = (
	market: unknown,
	pin: { latitude: number; longitude: number } | null
): boolean => {
	const regions = (market as { deliveryRegions?: unknown } | null | undefined)
		?.deliveryRegions as
		| { latitude?: number; longitude?: number; radiusKm?: number }[]
		| undefined;
	if (!Array.isArray(regions) || !regions.length) return true; // no green zone -> city-based only
	if (!pin) return true; // no shopper pin -> fall back to city-based rule
	return pointInAnyRegion(pin.latitude, pin.longitude, regions);
};

/**
 * Collect every identifier a market might be referenced by (id / username /
 * name), lower-cased, so a promo's market can be matched against the cart's
 * market no matter how the API returns it (populated object, id string, ...).
 */
export const collectMarketTokens = (market: unknown): Set<string> => {
	const tokens = new Set<string>();
	if (!market) return tokens;
	if (typeof market === "string") {
		tokens.add(market.toLowerCase());
		return tokens;
	}
	if (typeof market === "object") {
		const m = market as Record<string, unknown>;
		["_id", "id", "username", "name"].forEach((key) => {
			if (m[key]) tokens.add(String(m[key]).toLowerCase());
		});
	}
	return tokens;
};

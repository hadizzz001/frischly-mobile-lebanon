import { httpClient } from "./httpClient";
import type { Market, Subcategory } from "@/types/models";

// A market's own category (MarketCategory collection) with its subcategories.
export interface MarketCategory {
	_id: string;
	name: string;
	subcategories?: Subcategory[];
	[key: string]: unknown;
}

export const MarketService = {
	// Optional `pin` (the shopper's exact map location) lets the server also
	// scope results to markets whose configured delivery range (map pin(s) +
	// radius, or named Zone documents) actually covers that point — falling
	// back to city-only matching for markets that haven't configured a range.
	listPublic: (city?: string, pin?: { latitude: number; longitude: number }) =>
		httpClient.get<Market[]>("/markets/public", {
			params: {
				...(city ? { city } : undefined),
				...(pin ? { lat: pin.latitude, lng: pin.longitude } : undefined),
			},
		}),

	getById: (id: string) => httpClient.get<Market>(`/markets/${id}`),

	// A market's own categories/subcategories (MarketCategory collection).
	categories: (id: string) =>
		httpClient.get<MarketCategory[]>(`/markets/${id}/categories`),
};

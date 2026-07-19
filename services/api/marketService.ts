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
	listPublic: (city?: string) =>
		httpClient.get<Market[]>("/markets/public", {
			params: city ? { city } : undefined,
		}),

	getById: (id: string) => httpClient.get<Market>(`/markets/${id}`),

	// A market's own categories/subcategories (MarketCategory collection).
	categories: (id: string) =>
		httpClient.get<MarketCategory[]>(`/markets/${id}/categories`),
};

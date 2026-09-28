import type { Market } from "@/types/models";
import { httpClient } from "./httpClient";

import type { MarketCategory } from "@/types/services/marketService.types";

export type { MarketCategory };

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
		httpClient
			.get<MarketCategory[]>(`/markets/${id}/categories`)
			.then((res) => {
				// The server answers `{ data: { data: [...], subcategories: [...] } }`.
				// Two arrays means the client's list-envelope unwrap leaves it alone,
				// so `res.data` was an object and every caller saw "no categories"
				// (the market page hid its whole "Shop by category" row). Hoist the
				// category array here so `res.data` is always the list.
				const payload = res?.data as unknown;
				const list = Array.isArray(payload)
					? payload
					: (payload as { data?: unknown } | null)?.data;
				return {
					...res,
					data: (Array.isArray(list) ? list : []) as MarketCategory[],
				};
			}),
};

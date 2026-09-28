import { httpClient } from "./httpClient";
import type { Kitchen, KitchenCategory } from "@/types/models";

// Kitchens and kitchen categories are tenant-scoped on the backend:
//   market: "none"  -> FreshlyLB's own (main store, `market: null` documents)
//   market: "<id>"  -> that market's own
//   market omitted  -> every store's, mixed together
// Always pass a scope from the app so a market's kitchens can never appear on
// the FreshlyLB pages (or vice versa).
export interface KitchenScope {
	market?: string;
	category?: string;
	city?: string;
}

export const KitchenService = {
	listPublic: ({ market, category, city }: KitchenScope = {}) =>
		httpClient.get<Kitchen[]>("/kitchens/public", {
			params: {
				...(market ? { market } : undefined),
				...(category ? { category } : undefined),
				...(city ? { city } : undefined),
			},
		}),

	getById: (id: string) => httpClient.get<Kitchen>(`/kitchens/${id}`),

	// Public single kitchen (with its items) used by the kitchen detail screen.
	getByIdPublic: (id: string) =>
		httpClient
			.get<{ kitchen: Kitchen }>(`/kitchens/public/${id}`)
			.then((res) => ({
				...res,
				// The server wraps a single kitchen as `{ data: { kitchen } }`, and
				// the client only unwraps LIST envelopes. Hoist it here — like
				// ProductService.getById does with `.product` — so callers can use
				// `res.data` (and `res.data.items`) directly.
				data: ((res?.data as unknown as { kitchen?: Kitchen })?.kitchen ??
					res?.data) as Kitchen,
			})),

	categoriesPublic: ({ market }: Pick<KitchenScope, "market"> = {}) =>
		httpClient.get<KitchenCategory[]>("/kitchen-categories/public", {
			params: market ? { market } : undefined,
		}),
};

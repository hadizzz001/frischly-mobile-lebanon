import { httpClient } from "./httpClient";
import type { Kitchen, KitchenCategory } from "@/types/models";

export const KitchenService = {
	listPublic: (city?: string) =>
		httpClient.get<Kitchen[]>("/kitchens/public", {
			params: city ? { city } : undefined,
		}),

	// Public list optionally scoped to a kitchen category id.
	listPublicByCategory: (category: string) =>
		httpClient.get<Kitchen[]>("/kitchens/public", {
			params: { category },
		}),

	getById: (id: string) => httpClient.get<Kitchen>(`/kitchens/${id}`),

	// Public single kitchen (with its items) used by the kitchen detail screen.
	getByIdPublic: (id: string) =>
		httpClient.get<Kitchen>(`/kitchens/public/${id}`),

	categoriesPublic: () =>
		httpClient.get<KitchenCategory[]>("/kitchen-categories/public"),
};

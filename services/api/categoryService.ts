import { httpClient } from "./httpClient";
import type { Category, Subcategory } from "@/types/models";

export const CategoryService = {
	list: (limit?: number) =>
		httpClient.get<Category[]>("/categories", {
			params: limit ? { limit } : undefined,
		}),

	getById: (id: string) => httpClient.get<Category>(`/categories/${id}`),

	subcategories: (categoryId?: string) =>
		httpClient.get<Subcategory[]>("/subcategories", {
			params: categoryId ? { category: categoryId } : undefined,
		}),
};

import { httpClient } from "./httpClient";
import type { ApiResponse } from "@/types/api";
import type { Product } from "@/types/models";

export interface ProductQuery {
	page?: number;
	limit?: number;
	isActive?: boolean | string;
	inAds?: string;
	stockLevel?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	market?: string;
	category?: string;
	subcategory?: string;
	search?: string;
	priceRange?: string;
	shelfNumber?: string;
	minDiscount?: number | string;
}

export const ProductService = {
	list: (query: ProductQuery = {}) =>
		httpClient.get<Product[]>("/products", {
			params: query as Record<string, string | number | boolean | undefined>,
		}),

	getById: (id: string) => httpClient.get<Product>(`/products/${id}`),

	getDiscounted: (query: ProductQuery = {}) =>
		httpClient.get<Product[]>("/products/discount", {
			params: query as Record<string, string | number | boolean | undefined>,
		}),
};

export type { Product, ApiResponse };

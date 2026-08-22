import { httpClient } from "./httpClient";
import type { ApiResponse } from "@/types/api";
import type { Product } from "@/types/models";

import type { ProductQuery } from "@/types/services/productService.types";

export type { ProductQuery };

export const ProductService = {
	list: (query: ProductQuery = {}) =>
		httpClient.get<Product[]>("/products", {
			params: query as Record<string, string | number | boolean | undefined>,
		}),

	getById: (id: string) =>
		httpClient.get<{ product: Product }>(`/products/${id}`).then((res) => ({
			...res,
			// The server wraps a single product as `{ data: { product } }`.
			// Hoist it here so every caller can just use `res.data` directly,
			// instead of every screen/component needing to know (or forget)
			// about the nested `.product` key.
			data: (res?.data as unknown as { product?: Product })?.product as Product,
		})),

	getDiscounted: (query: ProductQuery = {}) =>
		httpClient.get<Product[]>("/products/discount", {
			params: query as Record<string, string | number | boolean | undefined>,
		}),
};

export type { Product, ApiResponse };

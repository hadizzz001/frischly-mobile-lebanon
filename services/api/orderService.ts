import type { Order } from "@/types/models";
import { httpClient } from "./httpClient";

import type { RiderLocationInfo } from "@/types/services/orderService.types";

export type { RiderLocationInfo };

export const OrderService = {
	list: () => httpClient.get<Order[]>("/orders", { auth: true }),

	getById: (id: string) =>
		httpClient.get<Order>(`/orders/${id}`, { auth: true }),

	create: (payload: unknown) =>
		httpClient.post<Order>("/orders", payload, { auth: true }),

	cancel: (id: string, reason?: string) =>
		httpClient.patch<Order>(`/orders/${id}/cancel`, { reason }, { auth: true }),

	// Live rider location for tracking an in-progress order.
	riderLocation: (id: string) =>
		httpClient.get<RiderLocationInfo>(`/orders/${id}/rider-location`, {
			auth: true,
		}),
};

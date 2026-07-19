import { httpClient } from "./httpClient";
import type { Address, Order } from "@/types/models";

// Payload returned by GET /orders/:id/rider-location. Mirrors the admin
// riderslocation dashboard: live GPS if available, otherwise address/city/zone
// data the client geocodes as a fallback.
export interface RiderLocationInfo {
	hasRider?: boolean;
	hasLocation?: boolean;
	latitude?: number;
	longitude?: number;
	address?: Address;
	zones?: string[];
	lastUpdated?: string;
	rider?: {
		name?: string;
		phone?: string;
		vehicleType?: string;
		vehicleNumber?: string;
	} | null;
	[key: string]: unknown;
}

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

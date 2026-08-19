// Order-related pure helpers.

import type { Order, OrderItem } from "@/types";

/** An order item's product can arrive populated or as a bare id string. */
export const getProductId = (orderItem: OrderItem): string | undefined => {
	const product = orderItem?.product;
	return typeof product === "string" ? product : product?._id;
};

/** Most recently created (falling back to updated) order in the list. */
export const getLatestOrder = (orders: Order[]): Order | undefined => {
	return [...orders].sort((a, b) => {
		const firstDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
		const secondDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
		return secondDate - firstDate;
	})[0];
};

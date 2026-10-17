// Order-related pure helpers.

import type { CartItem, Order, OrderItem, Product } from "@/types";

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

/**
 * The cart lines that repeat `order` once: every item whose product still
 * exists, is active and is in stock, at the quantity it was ordered in
 * (capped to the stock left). Products are re-read through `fetchProduct`
 * so prices and stock are current; the rest are counted as `skipped`.
 *
 * The lines go to `addItemsToCart`, which ADDS each quantity to what the cart
 * already holds (capped to stock). So a line must carry only the ordered
 * quantity — never the cart's own quantity on top. Both repeat buttons used
 * to send "already in cart + ordered", the cart counted itself twice, and
 * each tap compounded the previous ones: 1, then 3, then 7, ...
 */
export const buildRepeatCartItems = async (
	order: Pick<Order, "items"> | undefined,
	fetchProduct: (productId: string) => Promise<Product | null>,
): Promise<{ items: CartItem[]; skipped: number }> => {
	const orderItems = order?.items ?? [];
	const products = await Promise.all(
		orderItems.map((orderItem) => {
			const productId = getProductId(orderItem);
			return productId ? fetchProduct(productId).catch(() => null) : Promise.resolve(null);
		}),
	);

	const items: CartItem[] = [];
	let skipped = 0;
	orderItems.forEach((orderItem, index) => {
		const product = products[index];
		const stock = Number(product?.stock || 0);
		if (!product || product.isActive === false || stock <= 0) {
			skipped += 1;
			return;
		}
		const ordered = Math.max(1, Math.floor(Number(orderItem.quantity) || 1));
		items.push({ ...product, quantity: Math.min(ordered, stock) });
	});

	return { items, skipped };
};

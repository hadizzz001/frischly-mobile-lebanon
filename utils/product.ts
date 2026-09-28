// Product-related pure helpers shared by the shop, search, kitchen and
// product-detail screens. Extracted verbatim from those screens so the exact
// same formatting/pricing rules are applied everywhere.

import type { Product } from "@/types";

/**
 * Renders a product's `weight` field as a display string.
 *
 * The API returns this field in several shapes over time (plain string, plain
 * number, or a `{ value, unit }` object), so every shape is normalised here.
 * Returns an empty string when there is nothing to show.
 */
export function formatWeight(weight: unknown): string {
	if (weight === null || weight === undefined) return "";
	if (typeof weight === "string" || typeof weight === "number") return String(weight);
	if (typeof weight === "object") {
		const w = weight as { value?: string | number; unit?: string };
		if (w.value !== undefined) return `${w.value}${w.unit ? ` ${w.unit}` : ""}`;
		if (w.unit !== undefined) return String(w.unit);
	}
	return "";
}

const numeric = (value: unknown): number => parseFloat(String(value)) || 0;

/**
 * Adds what the shopper actually pays on top of a price: the item's tax
 * percentage and its bottle refund.
 *
 * This mirrors CartContext's `calculatePriceDetails` exactly (tax is charged on
 * the discounted price, the bottle refund is a flat addition), so the price on
 * a card, on the product page, in the cart and at checkout are the same number.
 */
const withTaxAndRefund = (price: number, item: Product): number => {
	const taxPercent = numeric(item.tax);
	const bottleRefund = numeric(item.bottlerefund);
	return price + (price * taxPercent) / 100 + bottleRefund;
};

/**
 * Final (display) price: base price minus the discount, plus tax and bottle
 * refund — i.e. what the line will actually cost.
 */
export const getFinalPrice = (item: Product) => {
	const basePrice = numeric(item.price);
	const discountPercent = numeric(item.discount);
	return withTaxAndRefund(basePrice - (basePrice * discountPercent) / 100, item);
};

/**
 * The pre-discount price shown struck through beside {@link getFinalPrice},
 * carrying the same tax + bottle refund so the two are comparable and the
 * difference between them is the real saving.
 */
export const getBasePrice = (item: Product) =>
	withTaxAndRefund(numeric(item.price), item);

/**
 * Cuts a product name down to `max` characters and appends "..." when it was
 * actually cut, so every listing card shows a predictable single-/two-line
 * title instead of relying on the platform's own ellipsis.
 */
export const truncateName = (name: string, max: number): string => {
	const value = String(name ?? "");
	return value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;
};

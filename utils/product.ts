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

/** Final (display) price = base price minus the discount percentage. */
export const getFinalPrice = (item: Product) => {
	const basePrice = parseFloat(String(item.price)) || 0;
	const discountPercent = parseFloat(String(item.discount)) || 0;
	return basePrice - (basePrice * discountPercent) / 100;
};

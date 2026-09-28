// Shared kitchen rules — which kitchens a shopper may see, and how kitchens are
// grouped into categories.
//
// Kitchens are tenant-scoped on the backend: `market: null` means the kitchen
// belongs to FreshlyLB (the main store), any other value means it belongs to
// that market. `/kitchens/public` and `/kitchen-categories/public` both take a
// `market` query param, so the scoping is done server-side and the app never
// has to sort a mixed list itself.
//
// Everything kitchen-related that both the slider and the kitchen-category
// screen need lives here, so the list a category shows can never disagree with
// the slider that opened it.

import { KitchenService } from "@/services/api";
import type { Kitchen, KitchenCategory, Product } from "@/types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { getUserCityAndPin } from "@/utils/userCity";

/** `market` value that scopes a public kitchen request to FreshlyLB itself. */
export const MAIN_STORE_SCOPE = "none";

/** Reads a kitchen's category id whether `category` is an id or a populated object. */
export const kitchenCategoryId = (kitchen: Kitchen): string => {
	const category = kitchen?.category;
	if (!category) return "";
	return typeof category === "string" ? category : String(category._id || "");
};

// Keep only items that can actually be ordered (active + in stock) and attach a
// default quantity of 1 each. Used to build the "add all to cart" payloads.
export const getKitchenCartItems = (
	kitchen?: { items?: Product[] } | null,
): (Product & { quantity: number })[] =>
	(kitchen?.items || [])
		.filter(
			(p) => p && p._id && p.isActive !== false && Number(p.stock || 0) > 0,
		)
		.map((p) => ({ ...p, quantity: 1 }));

/**
 * Is this whole kitchen already in the cart?
 *
 * TRUE only when EVERY one of its orderable items is in the cart — never when
 * merely one of them is. Two kitchens of the same store routinely share a
 * product (Beirut mart's "Cake 2" and "Cake 3" share one), and with a "some"
 * rule adding the first kitchen made the second one show as added too, so a
 * shopper who wanted one kitchen appeared to have taken both.
 */
export const isKitchenInCart = (
	kitchen: { items?: Product[] } | null | undefined,
	cart: { _id: string }[],
): boolean => {
	const items = getKitchenCartItems(kitchen);
	if (!items.length) return false;
	return items.every((item) =>
		(cart || []).some((entry) => String(entry._id) === String(item._id)),
	);
};

/**
 * The kitchens of ONE store, already scoped by the server.
 *
 * `marketId` omitted -> FreshlyLB's own kitchens; passing a market id -> that
 * market's own kitchens. Pass `category` to narrow the list to a single kitchen
 * category (also applied client-side, since the public endpoint currently
 * ignores that query param).
 *
 * Visibility: FreshlyLB's kitchens follow the main store's city + delivery-pin
 * gate — exactly the rule its products, hot-sale carousel and categories
 * already use. A market's kitchens carry no extra gate: a shopper only reaches
 * a market's page when that market itself passed its own city/pin check, so
 * re-testing here (against a market object that the kitchens endpoint does not
 * populate `deliveryRegions` on) would wrongly hide every kitchen of a market
 * the shopper reached through its delivery pin.
 */
export const loadStoreKitchens = async (
	marketId?: string | null,
	category?: string | null,
): Promise<Kitchen[]> => {
	if (!marketId) {
		const { city, pin } = await getUserCityAndPin();
		if (!(await isServedByAdmin(city, pin))) return [];
	}

	const res = await KitchenService.listPublic({
		market: marketId ? String(marketId) : MAIN_STORE_SCOPE,
		category: category || undefined,
	});
	const list = Array.isArray(res?.data) ? res.data : [];

	const active = list.filter((k) => k?.isActive !== false);
	return category
		? active.filter((k) => kitchenCategoryId(k) === String(category))
		: active;
};

/**
 * The categories these kitchens are filed under, in the order the kitchens
 * arrive (the API sorts by `sortOrder`). Only categories that actually hold a
 * kitchen are returned, so tapping one can never open an empty page.
 *
 * `fullCategories` is the store's own category list: it carries the picture
 * used on the card, which the copy populated on a kitchen may not have.
 */
export const deriveKitchenCategories = (
	kitchens: Kitchen[],
	fullCategories: KitchenCategory[] = [],
): KitchenCategory[] => {
	const byId = new Map<string, KitchenCategory>();

	for (const kitchen of kitchens) {
		const id = kitchenCategoryId(kitchen);
		if (!id || byId.has(id)) continue;

		const full = fullCategories.find((entry) => String(entry?._id) === id);
		const populated = kitchen.category;
		const entry =
			full || (populated && typeof populated === "object" ? populated : null);
		if (entry) byId.set(id, entry as KitchenCategory);
	}

	return Array.from(byId.values());
};

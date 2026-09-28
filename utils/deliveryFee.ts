// Dynamic delivery fee of the store a cart belongs to.
//
// Each store configures its delivery on its dashboard:
//   FreshlyLB (main store) -> Setting.deliveryFee + Setting.freeDeliveryThreshold,
//                             served on /settings/public
//   a market               -> MarketSetting.deliveryFee + freeDeliveryThreshold,
//                             attached to each entry of /markets/public
//
// The fee is "dynamic": a flat delivery fee applies, but once the order's
// subtotal reaches the store's free-delivery threshold delivery becomes free.
// The backend charges exactly the same figure when the order is created, so the
// total shown at checkout matches the order that is placed.

import { MarketService, SettingsService } from "@/services/api";

/** Reads a fee-like value, treating anything missing/invalid as 0. */
const toFee = (value: unknown): number => {
	const fee = Number(value);
	return Number.isFinite(fee) && fee > 0 ? fee : 0;
};

/** A store's delivery configuration. */
export interface DeliveryConfig {
	/** Flat delivery fee charged when the free threshold isn't reached. */
	deliveryFee: number;
	/** Subtotal at which delivery becomes free. 0 = no free-delivery rule. */
	freeDeliveryThreshold: number;
}

/**
 * The delivery configuration for one store. Pass the market's id for a market
 * cart, or nothing (or null) for a FreshlyLB cart. Returns free delivery (0 fee,
 * 0 threshold) when the store hasn't set one, and on any network error, so
 * checkout never blocks on it.
 */
export const getDeliveryConfig = async (
	marketId?: string | null,
): Promise<DeliveryConfig> => {
	try {
		if (!marketId) {
			const res = await SettingsService.getPublic();
			const data = (res?.data ?? res) as
				| { deliveryFee?: unknown; freeDeliveryThreshold?: unknown }
				| null;
			return {
				deliveryFee: toFee(data?.deliveryFee),
				freeDeliveryThreshold: toFee(data?.freeDeliveryThreshold),
			};
		}

		// Same public list the checkout screen already uses to resolve a
		// market's display name; each entry now carries its own delivery config.
		const res = await MarketService.listPublic();
		const list = Array.isArray(res?.data) ? res.data : [];
		const found = list.find((m) => String(m._id) === String(marketId));
		return {
			deliveryFee: toFee(found?.deliveryFee),
			freeDeliveryThreshold: toFee(found?.freeDeliveryThreshold),
		};
	} catch {
		return { deliveryFee: 0, freeDeliveryThreshold: 0 };
	}
};

/**
 * The effective delivery fee for an order, given the store's config and the
 * current cart subtotal. Returns 0 (free) when a free-delivery threshold is set
 * and the subtotal reaches it; otherwise the flat fee. Mirrors the backend.
 */
export const computeDeliveryFee = (
	config: DeliveryConfig,
	subtotal: number,
): number => {
	const sub = Number(subtotal) || 0;
	if (config.freeDeliveryThreshold > 0 && sub >= config.freeDeliveryThreshold) {
		return 0;
	}
	return config.deliveryFee;
};

/**
 * Convenience: resolve a store's config and return the effective fee for the
 * given subtotal in one call.
 */
export const getDeliveryFee = async (
	marketId?: string | null,
	subtotal = 0,
): Promise<number> => {
	const config = await getDeliveryConfig(marketId);
	return computeDeliveryFee(config, subtotal);
};

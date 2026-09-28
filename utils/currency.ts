// USD -> LBP conversion used by the product screens.
//
// The rate is configured by the FreshlyLB admin (Dashboard -> Settings -> "USD
// to LBP Exchange Rate") and exposed on GET /api/settings/public. Until that
// call resolves — and whenever it fails — we fall back to the default rate so a
// price is never rendered blank.

import { SettingsService } from "@/services/api";

/** Fallback rate used before/without an admin-configured value: 90,000 LBP = $1. */
export const DEFAULT_USD_TO_LBP_RATE = 90000;

let cachedRate = DEFAULT_USD_TO_LBP_RATE;
let ratePromise: Promise<number> | null = null;
let rateFetchedAt = 0;
// Same TTL as the other cached settings reads (see utils/cityVisibility.ts):
// short enough that a dashboard change shows up quickly, long enough to avoid
// hitting the settings endpoint on every card render.
const RATE_TTL = 30 * 1000;

const fetchRate = async (): Promise<number> => {
	try {
		const res = await SettingsService.getPublic();
		const data = (res?.data ?? res) as { usdToLbpRate?: unknown } | null;
		const rate = Number(data?.usdToLbpRate);
		if (Number.isFinite(rate) && rate > 0) {
			cachedRate = rate;
			return rate;
		}
	} catch {
		// Network/parse error -> keep the last known (or default) rate.
	}
	return cachedRate;
};

/** The admin-configured USD -> LBP rate, cached for a short while. */
export const getUsdToLbpRate = (
	{ force = false }: { force?: boolean } = {},
): Promise<number> => {
	const isStale = Date.now() - rateFetchedAt > RATE_TTL;
	if (force || isStale || !ratePromise) {
		ratePromise = fetchRate();
		rateFetchedAt = Date.now();
	}
	return ratePromise;
};

/** Last known rate, available synchronously (defaults until the first fetch). */
export const getCachedUsdToLbpRate = (): number => cachedRate;

/** Groups an integer with thousands separators without relying on Intl. */
const groupThousands = (value: number): string =>
	String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/** `12.5` -> `"LBP 1,125,000"` at a 90,000 rate (currency first, as on the cards). */
export const formatLbp = (
	usd: number,
	rate: number = cachedRate,
): string => `LBP ${groupThousands((Number(usd) || 0) * (rate || DEFAULT_USD_TO_LBP_RATE))}`;

/** `12.5` -> `"$12.50"`. */
export const formatUsd = (usd: number): string => `$${(Number(usd) || 0).toFixed(2)}`;

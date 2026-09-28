import { useEffect, useState } from "react";

import { getCachedUsdToLbpRate, getUsdToLbpRate } from "@/utils/currency";

/**
 * The admin-configured USD -> LBP rate (Dashboard -> Settings -> "USD to LBP
 * Exchange Rate"), for screens/cards that price in LBP.
 *
 * Starts from the last known (or default) rate so a price is rendered on the
 * very first frame, then refreshes from the settings endpoint. The fetch itself
 * is cached + de-duplicated in utils/currency, so a whole grid of cards calling
 * this hook still results in a single request.
 */
export function useUsdToLbpRate(): number {
	const [rate, setRate] = useState<number>(getCachedUsdToLbpRate());

	useEffect(() => {
		let cancelled = false;
		getUsdToLbpRate()
			.then((value) => {
				if (!cancelled) setRate(value);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	return rate;
}

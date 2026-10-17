import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";

import { handOffCheckoutSession, loadCheckoutSession } from "@/utils/checkoutSession";

/**
 * Opens checkout with the shopper's session already loaded (see
 * utils/checkoutSession.ts). While it loads, the tapped button shows a
 * spinner — `isPreparing(key)` — instead of checkout flashing a loading page;
 * a guest or an expired session is sent to sign in instead.
 *
 * Pass a key when one screen has several checkout buttons, so only the tapped
 * one spins.
 */
export function useGoToCheckout() {
	const router = useRouter();
	const [preparingKey, setPreparingKey] = useState<string | null>(null);
	const running = useRef(false);

	const goToCheckout = useCallback(
		async (key: string = "checkout") => {
			if (running.current) return;
			running.current = true;
			setPreparingKey(key);
			try {
				const session = await loadCheckoutSession();
				if (!session) {
					router.push("/start");
					return;
				}
				handOffCheckoutSession(session);
				router.push("/checkout");
			} finally {
				running.current = false;
				setPreparingKey(null);
			}
		},
		[router],
	);

	return {
		goToCheckout,
		/** Some checkout button on this screen is loading. */
		preparing: preparingKey !== null,
		isPreparing: (key: string = "checkout") => preparingKey === key,
	};
}

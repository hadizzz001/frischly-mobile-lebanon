import { useCallback, useRef, useState } from "react";

import { ACTION_BUSY_MIN_MS } from "@/constants/timing";

/**
 * Per-button busy state for cart actions (add, remove, +/-).
 *
 * `run(key, action)` marks that one button busy — so the screen can swap its
 * icon for a spinner — and clears it when the action is done. The work is
 * deferred by a frame on purpose: adding/removing re-renders the list around
 * the button, and doing that in the same commit means the spinner only appears
 * after that work, i.e. never when it matters. A short floor keeps an instant
 * action from flickering.
 */
export function useBusyAction() {
	const [busyKey, setBusyKey] = useState<string | null>(null);
	const running = useRef(false);

	const run = useCallback((key: string, action: () => void | Promise<void>) => {
		if (running.current) return;
		running.current = true;
		setBusyKey(key);

		requestAnimationFrame(async () => {
			try {
				await Promise.all([
					action(),
					new Promise((resolve) => setTimeout(resolve, ACTION_BUSY_MIN_MS)),
				]);
			} finally {
				running.current = false;
				setBusyKey(null);
			}
		});
	}, []);

	return {
		busyKey,
		isBusy: (key: string) => busyKey === key,
		/** Any button in this component is busy (disable the others meanwhile). */
		anyBusy: busyKey !== null,
		run,
	};
}

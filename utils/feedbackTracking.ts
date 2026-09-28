import AsyncStorage from "@react-native-async-storage/async-storage";

// The backend only allows ONE feedback submission per order (unique index on
// `order`), and the "rate your order" prompt is meant to be shown at most
// once per order. So, on-device, we keep a simple list of order ids that
// have already been "handled" — feedback submitted, the prompt dismissed, OR
// the order was skipped because another order's prompt was shown instead —
// so the same prompt never comes back, even after the app is closed and
// reopened.
const STORAGE_KEY = "frischly_feedback_handled_orders_v1";

// Every write is a read-modify-write of the whole list, so overlapping calls
// (e.g. a batch "skip the rest" landing at the same time as a submit) could
// otherwise clobber each other and silently drop ids. Serialising them
// through a single promise chain keeps the list append-only in practice.
let writeQueue: Promise<void> = Promise.resolve();

async function readHandledIds(): Promise<string[]> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

/** Every order id whose feedback prompt has already been handled on this device. */
export async function getHandledFeedbackIds(): Promise<Set<string>> {
	return new Set(await readHandledIds());
}

/**
 * Persists one or more order ids as handled. Resolves once the write has
 * actually landed in storage, so callers that need the skip to survive an
 * immediate app kill can `await` it.
 */
export function markFeedbackHandled(
	orderIds: string | readonly string[],
): Promise<void> {
	const incoming = (Array.isArray(orderIds) ? orderIds : [orderIds]).filter(
		Boolean,
	) as string[];
	if (incoming.length === 0) return Promise.resolve();

	const write = writeQueue.then(async () => {
		try {
			const ids = await readHandledIds();
			const known = new Set(ids);
			let changed = false;
			for (const id of incoming) {
				if (!known.has(id)) {
					known.add(id);
					ids.push(id);
					changed = true;
				}
			}
			if (changed) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		} catch (e) {
			console.warn("Failed to persist feedback-handled order(s):", e);
		}
	});

	// Keep the chain alive even if this write throws so later writes still run.
	writeQueue = write.catch(() => undefined);
	return write;
}

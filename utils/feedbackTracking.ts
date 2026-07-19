import AsyncStorage from "@react-native-async-storage/async-storage";

// The backend only allows ONE feedback submission per order (unique index on
// `order`) and there's no customer-facing endpoint to check whether feedback
// already exists for a given order. So, on-device, we keep a simple list of
// order ids that have already been "handled" (feedback submitted OR the
// prompt was dismissed) so we never nag the shopper twice — or try to submit
// a duplicate that the server would reject — for the same order.
const STORAGE_KEY = "frischly_feedback_handled_orders_v1";

async function readHandledIds(): Promise<string[]> {
	try {
		const raw = await AsyncStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export async function hasHandledFeedback(
	orderId: string | null | undefined,
): Promise<boolean> {
	if (!orderId) return true;
	const ids = await readHandledIds();
	return ids.includes(orderId);
}

export async function markFeedbackHandled(
	orderId: string | null | undefined,
): Promise<void> {
	if (!orderId) return;
	try {
		const ids = await readHandledIds();
		if (!ids.includes(orderId)) {
			ids.push(orderId);
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
		}
	} catch (e) {
		console.warn("Failed to persist feedback-handled order:", e);
	}
}

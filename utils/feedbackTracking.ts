import AsyncStorage from "@react-native-async-storage/async-storage";

// The backend only allows ONE feedback submission per order (unique index on
// `order`) and there's no customer-facing endpoint to check whether feedback
// already exists for a given order. So, on-device, we keep a simple list of
// order ids that have already been "handled" (feedback submitted OR the
// prompt was dismissed) so we never nag the shopper twice — or try to submit
// a duplicate that the server would reject — for the same order.
const STORAGE_KEY = "frischly_feedback_handled_orders_v1";

// When the shopper taps "Maybe Later", we snooze ALL feedback prompts (not
// just the one they were shown) until a genuinely NEW order is delivered —
// i.e. one that arrives after this timestamp. Without this, dismissing one
// prompt would immediately surface another prompt for a different past
// order on the very next background poll, which feels like the modal
// "keeps popping up" no matter what the shopper does.
const SNOOZE_KEY = "frischly_feedback_snoozed_at_v1";

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

/**
 * Returns the timestamp (ms since epoch) the shopper last tapped "Maybe
 * Later", or `null` if they've never snoozed / have since seen a newer
 * order's prompt. While a snooze is active, only orders delivered AFTER
 * this timestamp are eligible to trigger the feedback modal again.
 */
export async function getFeedbackSnoozeTimestamp(): Promise<number | null> {
	try {
		const raw = await AsyncStorage.getItem(SNOOZE_KEY);
		const ts = raw ? Number(raw) : NaN;
		return Number.isFinite(ts) ? ts : null;
	} catch {
		return null;
	}
}

/** Records "now" as the moment the shopper dismissed the feedback prompt. */
export async function setFeedbackSnoozeTimestamp(
	timestamp: number = Date.now(),
): Promise<void> {
	try {
		await AsyncStorage.setItem(SNOOZE_KEY, String(timestamp));
	} catch (e) {
		console.warn("Failed to persist feedback snooze timestamp:", e);
	}
}

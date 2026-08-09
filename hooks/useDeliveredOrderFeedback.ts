import {
    getFeedbackSnoozeTimestamp,
    hasHandledFeedback,
    markFeedbackHandled,
    setFeedbackSnoozeTimestamp,
} from "@/utils/feedbackTracking";
import { FeedbackService, OrderService } from "@/services/api";
import type { Order } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

// How often we silently poll the customer's orders, app-wide, looking for one
// that just became "delivered". Keeping this short (but not too aggressive)
// means the feedback prompt shows up shortly after the driver marks an order
// delivered — no matter which screen the shopper happens to be on, and
// without them ever having to open the Orders page or pull-to-refresh.
const POLL_MS = 10000;

/**
 * App-wide watcher: polls the logged-in user's orders in the background (on
 * an interval + whenever the app returns to the foreground) and surfaces the
 * id of the first "delivered" order that hasn't been rated yet. Meant to be
 * used ONCE near the root of the app (see app/_layout.tsx) so the feedback
 * modal can pop up automatically from anywhere — home, cart, product page,
 * etc. — the moment a delivery is completed.
 */
export interface DeliveredOrderFeedback {
	feedbackOrderId: string | null;
	/** Shopper tapped "Maybe Later" — snoozes ALL feedback prompts until a
	 *  genuinely new order is delivered. */
	skipFeedbackModal: () => void;
	/** Shopper successfully submitted feedback for the current order. */
	submitFeedbackModal: () => void;
}

// Best-effort timestamp for when an order was delivered — falls back to
// whichever date field is available so older order payloads still work.
function orderTimestampMs(order: Order): number {
	const raw = order.updatedAt || order.createdAt;
	const ms = raw ? new Date(raw).getTime() : NaN;
	return Number.isFinite(ms) ? ms : 0;
}

// Confirms this is a genuine, fully authenticated shopper session — never a
// guest, and never a corrupted/partial one — before we ever surface the
// feedback modal. Requires a valid auth token plus a real user id and a
// verifiable identifier (email or phone), i.e. exactly what a successful
// email/phone + password login produces.
function isFullyAuthenticated(parsedUser: any, token: unknown): boolean {
	if (!token || typeof token !== "string") return false;
	const user = parsedUser?.user;
	if (!user?._id) return false;
	if (!user?.email && !user?.phone && !user?.phoneNumber) return false;
	return true;
}

export default function useDeliveredOrderFeedback(): DeliveredOrderFeedback {
	const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
	// Orders already confirmed (this session) as not needing a prompt —
	// avoids re-checking AsyncStorage for the same order on every poll.
	const handledRef = useRef<Set<string>>(new Set());
	// Order ids the backend confirms ALREADY have feedback submitted for the
	// logged-in user — the authoritative "done" list, refreshed periodically
	// so it survives reinstalls / new devices / cleared on-device storage.
	const submittedOrderIdsRef = useRef<Set<string>>(new Set());
	// Prevents overlapping checks if a poll fires while a previous one is
	// still in flight (e.g. a slow network response).
	const checkingRef = useRef(false);
	// While set, only orders delivered AFTER this moment may trigger a
	// prompt — set whenever the shopper taps "Maybe Later" so old,
	// previously-unrated orders don't immediately re-surface the modal.
	const snoozedAtRef = useRef<number | null>(null);

	// Returns whether the authoritative "already submitted" list was
	// successfully refreshed. Callers MUST treat a `false` result as
	// "unknown" and skip prompting entirely this round — showing the modal
	// based on a stale/empty set is how an already-rated order could
	// resurface and the shopper ends up hitting the backend's "Feedback has
	// already been submitted for this order" error on submit.
	const refreshSubmittedFeedback = async (): Promise<boolean> => {
		try {
			const res = await FeedbackService.mine();
			const data = (res as any)?.data;
			const ids: string[] = Array.isArray(data) ? data : [];
			submittedOrderIdsRef.current = new Set(ids.map(String));
			return true;
		} catch (e) {
			console.warn("Failed to refresh submitted feedback list:", e);
			return false;
		}
	};

	const checkForDeliveredOrders = async () => {
		if (checkingRef.current) return;
		checkingRef.current = true;

		try {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");
			if (!userData || guest === "true") return;

			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;

			// Only ever prompt a real, fully-verified account (valid token +
			// user id + email/phone) — never guests or incomplete sessions.
			if (!isFullyAuthenticated(parsedUser, token)) return;

			// Keep the "already submitted" list fresh (once at start, then on
			// every poll) so feedback done on another device / after a
			// reinstall is respected immediately. Fail-closed: if this can't
			// be confirmed, don't risk prompting for an order that may
			// already be rated — just wait for the next successful poll.
			const refreshed = await refreshSubmittedFeedback();
			if (!refreshed) return;

			if (snoozedAtRef.current === null) {
				snoozedAtRef.current = await getFeedbackSnoozeTimestamp();
			}
			const snoozedAt = snoozedAtRef.current;

			const res = await OrderService.list();
			const orders: Order[] = Array.isArray(res?.data) ? res.data : [];
			const deliveredOrders = orders
				.filter((o) => o.status === "delivered")
				// While snoozed, only a genuinely NEW delivery (after the
				// snooze moment) may re-trigger the prompt.
				.filter((o) => snoozedAt === null || orderTimestampMs(o) > snoozedAt)
				// Oldest-eligible-first so we always ask about the order the
				// shopper is most likely to still remember.
				.sort((a, b) => orderTimestampMs(a) - orderTimestampMs(b));

			for (const order of deliveredOrders) {
				if (handledRef.current.has(order._id)) continue;

				// Backend says feedback already exists for this order — never
				// show the prompt again, regardless of local storage state.
				if (submittedOrderIdsRef.current.has(String(order._id))) {
					handledRef.current.add(order._id);
					markFeedbackHandled(order._id);
					continue;
				}

				// eslint-disable-next-line no-await-in-loop
				const alreadyHandled = await hasHandledFeedback(order._id);
				if (alreadyHandled) {
					handledRef.current.add(order._id);
					continue;
				}

				// Only ever surface one prompt at a time — if one is already
				// showing, leave it as-is instead of swapping it out.
				setFeedbackOrderId((current) => current ?? order._id);
				break;
			}
		} catch (e) {
			console.warn("Delivered-order feedback check failed:", e);
		} finally {
			checkingRef.current = false;
		}
	};

	useEffect(() => {
		checkForDeliveredOrders();

		const timer = setInterval(checkForDeliveredOrders, POLL_MS);
		const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
			if (nextState === "active") checkForDeliveredOrders();
		});

		return () => {
			clearInterval(timer);
			subscription.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Shopper tapped "Maybe Later": mark this order handled AND snooze every
	// other prompt until a new order is actually delivered — prevents older
	// un-rated orders from immediately popping up right after dismissing
	// this one.
	const skipFeedbackModal = () => {
		setFeedbackOrderId((current) => {
			if (current) {
				handledRef.current.add(current);
				markFeedbackHandled(current);
			}
			const now = Date.now();
			snoozedAtRef.current = now;
			setFeedbackSnoozeTimestamp(now);
			return null;
		});
	};

	// Shopper successfully submitted feedback: just mark this order handled
	// and hide the modal — no need to snooze anything else.
	const submitFeedbackModal = () => {
		setFeedbackOrderId((current) => {
			if (current) {
				handledRef.current.add(current);
				markFeedbackHandled(current);
			}
			return null;
		});
	};

	return { feedbackOrderId, skipFeedbackModal, submitFeedbackModal };
}

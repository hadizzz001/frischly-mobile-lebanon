import { FeedbackService, OrderService } from "@/services/api";
import type { Order } from "@/types";
import type { DeliveredOrderFeedback } from "@/types/hooks/useDeliveredOrderFeedback.types";
import {
    getHandledFeedbackIds,
    markFeedbackHandled,
} from "@/utils/feedbackTracking";
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
 * an interval + whenever the app returns to the foreground) and surfaces ONE
 * "delivered" order that hasn't been rated yet. Meant to be used ONCE near
 * the root of the app (see app/_layout.tsx) so the feedback modal can pop up
 * automatically from anywhere — home, cart, product page, etc. — the moment
 * a delivery is completed.
 *
 * Rules:
 *  - Only one prompt is ever on screen, and each order's prompt is shown at
 *    most once.
 *  - When several unrated deliveries are waiting, the shopper is asked about
 *    the most recent one and the rest are skipped for good — they are
 *    persisted as handled immediately so they never queue up behind it.
 *  - Once the shopper submits or cancels, that order is persisted as handled
 *    too, so the prompt never returns — even after the app is closed and
 *    reopened.
 */
export type { DeliveredOrderFeedback };

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
	// Mirror of `feedbackOrderId` that the poll and the resolve handlers can
	// read synchronously, without reaching into a React state updater.
	const currentOrderIdRef = useRef<string | null>(null);
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
			// A prompt is already on screen — leave it exactly as-is. Anything
			// delivered in the meantime is picked up on the first poll after
			// the shopper resolves the current one.
			if (currentOrderIdRef.current) return;

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

			const res = await OrderService.list();
			const orders: Order[] = Array.isArray(res?.data) ? res.data : [];
			const deliveredOrders = orders
				.filter((o) => o.status === "delivered")
				// Newest-first: when several deliveries are waiting, the one
				// the shopper just received is the one worth asking about.
				.sort((a, b) => orderTimestampMs(b) - orderTimestampMs(a));

			const persistedHandled = await getHandledFeedbackIds();

			// Everything delivered that still needs a decision this round.
			const pending: string[] = [];
			// Ids to persist as handled without ever prompting for them.
			const silentlyHandled: string[] = [];

			for (const order of deliveredOrders) {
				const id = String(order._id);
				if (handledRef.current.has(id)) continue;

				// Backend says feedback already exists for this order — never
				// show the prompt, regardless of local storage state.
				if (submittedOrderIdsRef.current.has(id)) {
					silentlyHandled.push(id);
					continue;
				}

				if (persistedHandled.has(id)) {
					handledRef.current.add(id);
					continue;
				}

				pending.push(id);
			}

			// Ask about ONE order; every other pending delivery is skipped for
			// good rather than queued up behind it.
			const [promptId, ...skippedIds] = pending;
			const toMark = [...silentlyHandled, ...skippedIds];
			for (const id of toMark) handledRef.current.add(id);
			// Persist the skips BEFORE the prompt appears so they hold even if
			// the app is killed the moment the modal shows.
			if (toMark.length > 0) await markFeedbackHandled(toMark);

			if (promptId) {
				currentOrderIdRef.current = promptId;
				setFeedbackOrderId(promptId);
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

	// Whether the shopper submitted or cancelled, the outcome is the same:
	// this order's prompt has been shown once and must never come back, so
	// persist it as handled and close the modal.
	const resolveCurrentPrompt = () => {
		const current = currentOrderIdRef.current;
		currentOrderIdRef.current = null;
		setFeedbackOrderId(null);
		if (current) {
			handledRef.current.add(current);
			void markFeedbackHandled(current);
		}
	};

	const skipFeedbackModal = resolveCurrentPrompt;
	const submitFeedbackModal = resolveCurrentPrompt;

	return { feedbackOrderId, skipFeedbackModal, submitFeedbackModal };
}

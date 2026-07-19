import {
    hasHandledFeedback,
    markFeedbackHandled,
} from "@/utils/feedbackTracking";
import { OrderService } from "@/services/api";
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
	closeFeedbackModal: () => void;
}

export default function useDeliveredOrderFeedback(): DeliveredOrderFeedback {
	const [feedbackOrderId, setFeedbackOrderId] = useState<string | null>(null);
	// Orders already confirmed (this session) as not needing a prompt —
	// avoids re-checking AsyncStorage for the same order on every poll.
	const handledRef = useRef<Set<string>>(new Set());
	// Prevents overlapping checks if a poll fires while a previous one is
	// still in flight (e.g. a slow network response).
	const checkingRef = useRef(false);

	const checkForDeliveredOrders = async () => {
		if (checkingRef.current) return;
		checkingRef.current = true;

		try {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");
			if (!userData && !guest) return;

			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;
			if (!token) return;

			const res = await OrderService.list();
			const orders: Order[] = res.data || [];
			const deliveredOrders = orders.filter((o) => o.status === "delivered");

			for (const order of deliveredOrders) {
				if (handledRef.current.has(order._id)) continue;

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

	// Mark the order as handled (feedback submitted or dismissed) so it's
	// never prompted again, then hide the modal.
	const closeFeedbackModal = () => {
		setFeedbackOrderId((current) => {
			if (current) {
				handledRef.current.add(current);
				markFeedbackHandled(current);
			}
			return null;
		});
	};

	return { feedbackOrderId, closeFeedbackModal };
}

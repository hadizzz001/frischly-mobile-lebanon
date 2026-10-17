// What the checkout screen needs before it can render: a signed-in shopper
// and their current profile (name, phone, address).
//
// It is loaded by whichever "checkout" button was tapped, behind a spinner in
// that button (hooks/useGoToCheckout.ts), and handed to the checkout screen
// here — so checkout paints complete on its first frame. Loading it on the
// checkout screen itself first showed a "Loading user info…" page and
// replaced it a moment later: the flash between the cart and checkout.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { AuthService } from "@/services/api";
import type { User } from "@/types";

export interface CheckoutSession {
	user: User;
	token: string;
}

/** A hand-off older than this is ignored (checkout then loads its own). */
const HANDOFF_TTL_MS = 30 * 1000;

let handoff: { session: CheckoutSession; at: number } | null = null;

/**
 * The signed-in shopper with a fresh profile, or null when checkout must not
 * open: an explicit guest, no saved session, no token, or a failed /me.
 */
export async function loadCheckoutSession(): Promise<CheckoutSession | null> {
	try {
		// Guest browsing ("Continue as guest") is stored as "true"; logged-in
		// accounts store "false" or nothing at all.
		if ((await AsyncStorage.getItem("guest")) === "true") return null;

		const userData = await AsyncStorage.getItem("userData");
		const token: string | undefined = userData ? JSON.parse(userData)?.token : undefined;
		if (!token) return null;

		const res = await AuthService.me();
		const user = (res.data as unknown as { user?: User } | null)?.user;
		return user ? { user, token } : null;
	} catch {
		return null;
	}
}

/** Hands a just-loaded session to the checkout screen that is about to open. */
export function handOffCheckoutSession(session: CheckoutSession): void {
	handoff = { session, at: Date.now() };
}

/** The handed-off session if it is still fresh (reading does not clear it). */
export function peekCheckoutSession(): CheckoutSession | null {
	if (!handoff || Date.now() - handoff.at > HANDOFF_TTL_MS) return null;
	return handoff.session;
}

export function clearCheckoutSession(): void {
	handoff = null;
}

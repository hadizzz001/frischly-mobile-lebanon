import { httpClient } from "./httpClient";

export interface ValidatePromoPayload {
	code: string;
	orderTotal: number;
	market?: string | null;
}

export const PromoCodeService = {
	// Validate a promo code against the current order total / market. Auth is
	// required so the backend can enforce per-user usage limits.
	validate: (payload: ValidatePromoPayload) =>
		httpClient.post<unknown>("/promocodes/validate", payload, { auth: true }),
};

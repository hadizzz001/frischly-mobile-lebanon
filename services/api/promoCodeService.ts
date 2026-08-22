import { httpClient } from "./httpClient";

import type { ValidatePromoPayload } from "@/types/services/promoCodeService.types";

export type { ValidatePromoPayload };

export const PromoCodeService = {
	// Validate a promo code against the current order total / market. Auth is
	// required so the backend can enforce per-user usage limits.
	validate: (payload: ValidatePromoPayload) =>
		httpClient.post<unknown>("/promocodes/validate", payload, { auth: true }),
};

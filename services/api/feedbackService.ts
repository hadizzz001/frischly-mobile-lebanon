import { httpClient } from "./httpClient";
import type { Feedback } from "@/types/models";

export const FeedbackService = {
	submit: (payload: Partial<Feedback> | Record<string, unknown>) =>
		httpClient.post<Feedback>("/feedback", payload, { auth: true }),
	// Order ids the logged-in customer has already submitted feedback for —
	// the backend's source of truth (a Feedback doc actually exists), used so
	// the "rate your order" prompt never resurfaces for an order that's
	// already done, even after a reinstall or on a different device.
	mine: () => httpClient.get<string[]>("/feedback/mine", { auth: true }),
};

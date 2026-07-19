import { httpClient } from "./httpClient";
import type { Feedback } from "@/types/models";

export const FeedbackService = {
	submit: (payload: Partial<Feedback> | Record<string, unknown>) =>
		httpClient.post<Feedback>("/feedback", payload, { auth: true }),
};

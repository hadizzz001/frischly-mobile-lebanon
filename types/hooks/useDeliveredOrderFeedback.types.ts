export interface DeliveredOrderFeedback {
	feedbackOrderId: string | null;
	/** Shopper tapped "Maybe Later" — snoozes ALL feedback prompts until a
	 *  genuinely new order is delivered. */
	skipFeedbackModal: () => void;
	/** Shopper successfully submitted feedback for the current order. */
	submitFeedbackModal: () => void;
}

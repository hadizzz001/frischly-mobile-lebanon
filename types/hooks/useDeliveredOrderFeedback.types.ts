export interface DeliveredOrderFeedback {
	feedbackOrderId: string | null;
	/** Shopper cancelled the prompt — the order is permanently marked handled
	 *  so its prompt is never shown again, even after an app restart. */
	skipFeedbackModal: () => void;
	/** Shopper successfully submitted feedback for the current order — same
	 *  end state as skipping: the prompt is never shown again. */
	submitFeedbackModal: () => void;
}

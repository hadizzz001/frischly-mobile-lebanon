export interface FeedbackModalProps {
	visible: boolean;
	orderId?: string | null;
	/** Shopper dismissed the modal without submitting ("Maybe Later", swipe
	 *  down, or hardware back). Distinct from onSubmitted so the caller can
	 *  snooze future prompts only when the shopper actually skips. */
	onSkip?: () => void;
	/** Feedback was submitted successfully. */
	onSubmitted?: () => void;
}

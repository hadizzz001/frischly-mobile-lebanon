export interface FeedbackModalProps {
	visible: boolean;
	orderId?: string | null;
	/** Shopper dismissed the modal without submitting ("Maybe Later", swipe
	 *  down, or hardware back). Kept separate from onSubmitted so the caller
	 *  can tell the two outcomes apart, even though both mean "don't ask about
	 *  this order again". */
	onSkip?: () => void;
	/** Feedback was submitted successfully. */
	onSubmitted?: () => void;
}

export interface MarketsSliderProps {
	refreshTrigger?: number;
	/**
	 * Reports to the home screen whether this section has anything to show, so
	 * it can replace an all-empty page with the "no store in your city" message.
	 */
	onContent?: (hasContent: boolean) => void;
	/** Hide this section's own spinner (the home screen shows a single one). */
	hideLoader?: boolean;
}

export interface DiscountCarouselProps {
	refreshTrigger?: number;
	// When set, the carousel shows THIS market's discounted products (and skips
	// the admin city gate) instead of the main store's.
	marketId?: string;
	/**
	 * Reports to the home screen whether this section has anything to show, so
	 * it can replace an all-empty page with the "no store in your city" message.
	 */
	onContent?: (hasContent: boolean) => void;
	/** Hide this section's own spinner (the home screen shows a single one). */
	hideLoader?: boolean;
}

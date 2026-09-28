export interface CategoriesGridProps {
	refreshTrigger?: number;
	// When set, show THIS market's own categories (from the MarketCategory
	// collection) and link into the market's shop instead of the main store.
	marketId?: string;
	marketName?: string;
	/**
	 * Reports to the home screen whether this section has anything to show, so
	 * it can replace an all-empty page with the "no store in your city" message.
	 */
	onContent?: (hasContent: boolean) => void;
	/** Hide this section's own spinner (the home screen shows a single one). */
	hideLoader?: boolean;
}

export interface ShopPageProps {
	refreshTrigger?: number;
	setRefreshing: (refreshing: boolean) => void;
	// When set, list THIS market's products (skipping the admin city gate)
	// instead of the main store's.
	marketId?: string;
	/**
	 * Reports to the home screen whether this section has anything to show, so
	 * it can replace an all-empty page with the "no store in your city" message.
	 */
	onContent?: (hasContent: boolean) => void;
	/** Hide this section's own spinner (the home screen shows a single one). */
	hideLoader?: boolean;
	/**
	 * Infinite scroll: this list renders inside the parent's ScrollView, so the
	 * parent bumps this counter whenever the shopper nears the bottom and the
	 * list fetches its next page (no "Load more" button).
	 */
	loadMoreSignal?: number;
}

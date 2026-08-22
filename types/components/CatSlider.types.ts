export interface CategoriesGridProps {
	refreshTrigger?: number;
	// When set, show THIS market's own categories (from the MarketCategory
	// collection) and link into the market's shop instead of the main store.
	marketId?: string;
	marketName?: string;
}

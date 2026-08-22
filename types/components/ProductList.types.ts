export interface ShopPageProps {
	refreshTrigger?: number;
	setRefreshing: (refreshing: boolean) => void;
	// When set, list THIS market's products (skipping the admin city gate)
	// instead of the main store's.
	marketId?: string;
}

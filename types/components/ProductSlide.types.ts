export interface DiscountCarouselProps {
	refreshTrigger?: number;
	// When set, the carousel shows THIS market's discounted products (and skips
	// the admin city gate) instead of the main store's.
	marketId?: string;
}

export interface ProductQuery {
	page?: number;
	limit?: number;
	isActive?: boolean | string;
	inAds?: string;
	stockLevel?: string;
	sortBy?: string;
	sortOrder?: "asc" | "desc";
	market?: string;
	category?: string;
	subcategory?: string;
	search?: string;
	priceRange?: string;
	shelfNumber?: string;
	minDiscount?: number | string;
}

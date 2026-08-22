import type { Subcategory } from "@/types/models";

// A market's own category (MarketCategory collection) with its subcategories.
export interface MarketCategory {
	_id: string;
	name: string;
	subcategories?: Subcategory[];
	[key: string]: unknown;
}

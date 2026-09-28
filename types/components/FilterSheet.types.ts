import type { Category, Subcategory } from "@/types";

export interface ShopFilters {
	search: string;
	category: string;
	subcategory: string;
	shelfNumber: string;
	sortBy: string;
	sortOrder: "asc" | "desc";
	/** "min-max" as the API expects, "" for all. */
	priceRange: string;
	stockLevel: string;
	discount: boolean;
	minDiscount: number;
}

export interface FilterSheetProps {
	visible: boolean;
	onClose: () => void;
	filters: ShopFilters;
	onChange: (next: ShopFilters) => void;
	onApply: () => void;
	onReset: () => void;
	categories: Category[];
	subcategories: Subcategory[];
	/** Hide category/subcategory chips (a market uses its own chips above). */
	hideTaxonomy?: boolean;
	/** Live number of products matching the draft filters (null = unknown). */
	matchCount: number | null;
	counting: boolean;
}

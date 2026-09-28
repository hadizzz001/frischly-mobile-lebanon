export interface HomeSkeletonProps {
	/**
	 * "home" (default) mirrors the main home page: ticker, markets row, hot sale,
	 * categories, grid. "market" mirrors a market's home page, which has no
	 * ticker or markets row.
	 */
	variant?: "home" | "market";
}

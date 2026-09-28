// Shared search helpers' constants.

/**
 * Words ignored when a search term is split into words for fuzzy matching, so
 * a filler word never drags unrelated products into the results.
 */
export const SEARCH_STOPWORDS = new Set([
	"and", "the", "with", "for", "of", "to", "in", "on", "a", "an",
]);

/**
 * Rotating suggestions shown in the header's search field, one after another
 * ("Search 'Cake'", "Search 'Salad'", ...). They are run through `td()`, so
 * they follow the app language like any other dynamic name.
 */
export const SEARCH_SUGGESTIONS = [
	"Cake",
	"Salad",
	"Bread",
	"Cheese",
	"Coffee",
	"Chocolate",
	"Chicken",
	"Fruits",
];

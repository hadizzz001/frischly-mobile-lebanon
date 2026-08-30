// Shared search helpers' constants.

/**
 * Words ignored when a search term is split into words for fuzzy matching, so
 * a filler word never drags unrelated products into the results.
 */
export const SEARCH_STOPWORDS = new Set([
	"and", "the", "with", "for", "of", "to", "in", "on", "a", "an",
]);

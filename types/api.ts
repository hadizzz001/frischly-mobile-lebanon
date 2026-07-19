// Standard API response envelope returned by the Frischly backend.
// Matches src/utils/apiResponse.js on the server:
//   { success, message, data, timestamp, ...meta }
export interface ApiResponse<T = unknown> {
	success: boolean;
	message?: string;
	data: T;
	timestamp?: string;
	// Legacy/extra top-level fields (pagination, token, etc.) spread via `meta`.
	[key: string]: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	page?: number;
	totalPages?: number;
	total?: number;
	count?: number;
}

export interface RequestOptions {
	/** Extra headers merged onto the defaults. */
	headers?: Record<string, string>;
	/** Whether to attach the stored auth token. Defaults to false. */
	auth?: boolean;
	/** Abort the request after this many ms. Falls back to API_TIMEOUT_MS. */
	timeoutMs?: number;
	/** Query params appended to the URL. */
	params?: Record<string, string | number | boolean | undefined | null>;
	/** JSON body (for POST/PUT/PATCH). */
	body?: unknown;
	signal?: AbortSignal;
}

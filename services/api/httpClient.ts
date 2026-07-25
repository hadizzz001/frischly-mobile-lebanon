// Centralized, typed HTTP client for the Frischly backend.
// Encapsulates base URL resolution, auth token injection, query-string
// building, JSON parsing, timeouts and error handling so screens/components
// never talk to `fetch` directly (Services Layer pattern).

import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

import { API_BASE_URL, API_TIMEOUT_MS } from "@/constants/api";
import type { ApiResponse, RequestOptions } from "@/types/api";

export class ApiError extends Error {
	status: number;
	payload: unknown;

	constructor(message: string, status: number, payload: unknown = null) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.payload = payload;
	}
}

// Read the logged-in user's JWT (stored by the login flow as { token, user }),
// falling back to the build-time token used for anonymous browsing.
async function getAuthToken(): Promise<string | null> {
	try {
		const raw = await AsyncStorage.getItem("userData");
		const parsed = raw ? JSON.parse(raw) : null;
		if (parsed?.token) return parsed.token as string;
	} catch {
		// ignore and fall through to build-time token
	}
	return (
		(Constants.expoConfig?.extra?.jwtToken as string | undefined) ||
		process.env.EXPO_PUBLIC_JWT_TOKEN ||
		null
	);
}

function buildQuery(
	params?: RequestOptions["params"],
): string {
	if (!params) return "";
	const usable = Object.entries(params).filter(
		([, v]) => v !== undefined && v !== null,
	);
	if (usable.length === 0) return "";
	const qs = usable
		.map(
			([k, v]) =>
				`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`,
		)
		.join("&");
	return `?${qs}`;
}

async function request<T>(
	method: string,
	path: string,
	options: RequestOptions = {},
): Promise<ApiResponse<T>> {
	const { headers = {}, auth = false, timeoutMs, params, body, signal } = options;

	const url = `${API_BASE_URL}${path}${buildQuery(params)}`;

	const finalHeaders: Record<string, string> = {
		Accept: "application/json",
		...headers,
	};
	if (body !== undefined && !(body instanceof FormData)) {
		finalHeaders["Content-Type"] = "application/json";
	}
	if (auth) {
		const token = await getAuthToken();
		if (token) finalHeaders.Authorization = `Bearer ${token}`;
	}

	const controller = new AbortController();
	const timeout = setTimeout(
		() => controller.abort(),
		timeoutMs ?? API_TIMEOUT_MS,
	);

	// Chain an external abort signal if provided.
	if (signal) {
		if (signal.aborted) controller.abort();
		else signal.addEventListener("abort", () => controller.abort());
	}

	try {
		let res: Response;
		try {
			res = await fetch(url, {
				method,
				headers: finalHeaders,
				body:
					body === undefined
						? undefined
						: body instanceof FormData
							? body
							: JSON.stringify(body),
				signal: controller.signal,
			});
		} catch (err) {
			// Normalize abort/timeout/network errors into a plain ApiError so
			// callers never have to deal with a raw DOMException/AbortError
			// (which, if it ever slips through unhandled, can surface as a
			// scary redbox / crash in Expo Go).
			const isAbort =
				(err as { name?: string })?.name === "AbortError" ||
				(err as { message?: string })?.message === "Aborted";
			if (isAbort) {
				const wasExternalAbort = !!signal?.aborted;
				throw new ApiError(
					wasExternalAbort
						? "Request cancelled"
						: "Request timed out. The server may be waking up — please try again.",
					0,
					null,
				);
			}
			throw new ApiError(
				(err as { message?: string })?.message || "Network request failed",
				0,
				null,
			);
		}

		let payload: unknown = null;
		const text = await res.text();
		if (text) {
			try {
				payload = JSON.parse(text);
			} catch {
				payload = text;
			}
		}

		if (!res.ok) {
			const message =
				(payload as ApiResponse)?.message ||
				`Request failed with status ${res.status}`;
			throw new ApiError(String(message), res.status, payload);
		}

		return payload as ApiResponse<T>;
	} finally {
		clearTimeout(timeout);
	}
}

export const httpClient = {
	get: <T>(path: string, options?: RequestOptions) =>
		request<T>("GET", path, options),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("POST", path, { ...options, body }),
	put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PUT", path, { ...options, body }),
	patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PATCH", path, { ...options, body }),
	delete: <T>(path: string, options?: RequestOptions) =>
		request<T>("DELETE", path, options),
};

export { getAuthToken };

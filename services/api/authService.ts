import type { AuthPayload, User } from "@/types/models";
import { httpClient } from "./httpClient";

export const AuthService = {
	login: (credentials: { identifier?: string; email?: string; phone?: string; password: string }) =>
		httpClient.post<null>("/auth/login", credentials),

	loginProfile: (payload: unknown) =>
		httpClient.post<null>("/auth/login-profile", payload),

	// Sign in / sign up with a Google ID token obtained on the device.
	// `address` is optional and carries the GPS-detected address when the
	// shopper allowed location access; the backend forces the Beirut default
	// into any field we couldn't detect.
	googleSignIn: (idToken: string, address?: unknown) =>
		httpClient.post<null>("/auth/google", { idToken, address }),

	// Sign in / sign up with an Apple identity token obtained on the device
	// (Sign in with Apple — required by App Store guideline 4.8 as an equivalent
	// login option next to Google). Apple only returns the full name / email on
	// the *first* authorization, so we forward them when present and the backend
	// keeps whatever it already stored otherwise.
	appleSignIn: (payload: {
		identityToken: string;
		authorizationCode?: string | null;
		userId?: string | null;
		email?: string | null;
		fullName?: string | null;
		address?: unknown;
	}) => httpClient.post<null>("/auth/apple", payload),

	register: (payload: unknown) =>
		httpClient.post<null>("/auth/register", payload),

	me: () => httpClient.get<User>("/auth/me", { auth: true }),

	updateProfile: (payload: unknown) =>
		httpClient.put<null>("/auth/profile", payload, { auth: true }),

	changePassword: (payload: unknown) =>
		httpClient.put<null>("/auth/change-password", payload, { auth: true }),

	// --- native password reset (no browser redirect) --------------------------
	// 1. request a code for the account's email (always 200, never reveals
	//    whether the email exists);
	requestPasswordReset: (email: string) =>
		httpClient.post<null>("/auth/forgot-password", { email }),
	// 2. exchange the emailed 6-digit code for the one-time reset token;
	verifyResetCode: (email: string, code: string) =>
		httpClient.post<{ token: string }>("/auth/verify-reset-code", { email, code }),
	// 3. set the new password with that token.
	resetPassword: (token: string, newPassword: string) =>
		httpClient.post<null>("/auth/reset-password", { token, newPassword }),
};

export type { AuthPayload };

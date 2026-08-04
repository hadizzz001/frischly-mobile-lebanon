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

	register: (payload: unknown) =>
		httpClient.post<null>("/auth/register", payload),

	me: () => httpClient.get<User>("/auth/me", { auth: true }),

	updateProfile: (payload: unknown) =>
		httpClient.put<null>("/auth/profile", payload, { auth: true }),

	changePassword: (payload: unknown) =>
		httpClient.put<null>("/auth/change-password", payload, { auth: true }),
};

export type { AuthPayload };

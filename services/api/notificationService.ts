import { httpClient } from "./httpClient";

// Push-notification token registration with the backend. The server stores the
// Expo push token in the user's `fcmToken` field and delivers via Expo.
export const NotificationService = {
	// Register (or refresh) the current device's Expo push token. Uses the
	// provided auth token explicitly so it can run outside the app's usual
	// auth flow (e.g. right after login before AsyncStorage is settled).
	registerToken: (fcmToken: string, authToken: string) =>
		httpClient.post<null>(
			"/notifications/token",
			{ fcmToken },
			{ headers: { Authorization: `Bearer ${authToken}` } },
		),

	// Drop the token on logout.
	removeToken: (authToken: string) =>
		httpClient.delete<null>("/notifications/token", {
			headers: { Authorization: `Bearer ${authToken}` },
		}),
};

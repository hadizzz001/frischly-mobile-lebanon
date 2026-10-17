import { httpClient } from "./httpClient";

// Push-notification token registration with the backend. The server keeps the
// Expo push token of every device the account is signed in on and delivers
// via Expo.
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

	// Drop this device's token on logout. The account keeps one token per
	// signed-in device, so naming the device leaves the others subscribed
	// (without it the server forgets every device on the account).
	removeToken: (authToken: string, fcmToken: string) =>
		httpClient.delete<null>("/notifications/token", {
			headers: { Authorization: `Bearer ${authToken}` },
			body: { fcmToken },
		}),
};

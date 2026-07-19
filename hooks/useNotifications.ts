import { NotificationService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { Router } from "expo-router";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

// Show notifications while the app is in the foreground.
Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowBanner: true,
		shouldShowList: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
	}),
});

// Read the logged-in user's JWT (stored by the login flow as { token, user }).
async function getAuthToken(): Promise<string | null> {
	try {
		const raw = await AsyncStorage.getItem("userData");
		const parsed = raw ? JSON.parse(raw) : null;
		return parsed?.token ?? null;
	} catch {
		return null;
	}
}

/**
 * Ask for permission, create the Android channel and return the Expo push token.
 * Returns null if running on a simulator, permission is denied, or no projectId.
 */
export async function registerForPushNotificationsAsync(): Promise<
	string | null
> {
	// Android requires a channel for notifications to be displayed.
	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "Default",
			importance: Notifications.AndroidImportance.MAX,
			vibrationPattern: [0, 250, 250, 250],
			lightColor: "#f4bb26",
		});
	}

	// Push tokens only work on real devices.
	if (!Device.isDevice) {
		console.warn("⚠️ Push notifications require a physical device.");
		return null;
	}

	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;
	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}
	if (finalStatus !== "granted") {
		console.warn("⚠️ Notification permission not granted.");
		return null;
	}

	const projectId =
		Constants?.expoConfig?.extra?.eas?.projectId ??
		Constants?.easConfig?.projectId;
	if (!projectId) {
		console.warn("⚠️ Missing EAS projectId — cannot get an Expo push token.");
		return null;
	}

	try {
		const { data: pushToken } = await Notifications.getExpoPushTokenAsync({
			projectId,
		});
		return pushToken; // e.g. ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
	} catch (err) {
		console.error("❌ Error getting Expo push token:", err);
		return null;
	}
}

/**
 * Get the Expo push token and send it to the backend (only when logged in).
 * The server stores it in the user's `fcmToken` field and delivers via Expo.
 */
export async function syncPushTokenToServer() {
	const authToken = await getAuthToken();
	if (!authToken) return; // only register tokens for logged-in users

	const pushToken = await registerForPushNotificationsAsync();
	if (!pushToken) return;

	// Skip the network call if we already sent this exact token.
	const alreadySent = await AsyncStorage.getItem("pushTokenSent");
	if (alreadySent === pushToken) return;

	try {
		await NotificationService.registerToken(pushToken, authToken);
		await AsyncStorage.setItem("pushTokenSent", pushToken);
		console.log("✅ Push token registered with server");
	} catch (err) {
		console.error("❌ Error sending push token to server:", err);
	}
}

/**
 * Tell the backend to drop the token. Call this on logout.
 */
export async function removePushTokenFromServer(
	authToken: string | null | undefined,
): Promise<void> {
	try {
		if (authToken) {
			await NotificationService.removeToken(authToken);
		}
	} catch (err) {
		console.error("❌ Error removing push token from server:", err);
	} finally {
		await AsyncStorage.removeItem("pushTokenSent");
	}
}

// Decide where to navigate when a notification is tapped, based on its data.
type NotificationData = {
	orderId?: string;
	order_id?: string;
	route?: string;
	[key: string]: unknown;
};

function handleNotificationNavigation(
	data: NotificationData | undefined,
	router: Router,
) {
	if (!data) return;
	const orderId = data.orderId ?? data.order_id;
	if (orderId) {
		router.push(`/track/${orderId}` as never);
		return;
	}
	// Generic fallback: allow the server to specify any in-app route.
	if (data.route) {
		router.push(String(data.route) as never);
	}
}

/**
 * Main hook: wires up the foreground handler, tap listeners and token
 * registration. Call this once near the root of the app.
 */
export default function useNotifications() {
	const router = useRouter();
	const receivedListener = useRef<Notifications.EventSubscription | null>(null);
	const responseListener = useRef<Notifications.EventSubscription | null>(null);

	useEffect(() => {
		// Register the token on startup (no-op if the user isn't logged in yet).
		syncPushTokenToServer();

		// Fired when a notification arrives while the app is foregrounded.
		receivedListener.current = Notifications.addNotificationReceivedListener(
			(notification) => {
				console.log(
					"🔔 Notification received:",
					notification?.request?.content?.title
				);
			}
		);

		// Fired when the user taps a notification.
		responseListener.current =
			Notifications.addNotificationResponseReceivedListener((response) => {
				const data = response?.notification?.request?.content?.data;
				handleNotificationNavigation(data, router);
			});

		// Handle a cold start that was triggered by tapping a notification.
		(async () => {
			const last = await Notifications.getLastNotificationResponseAsync();
			if (last) {
				const data = last.notification?.request?.content?.data;
				handleNotificationNavigation(data, router);
			}
		})();

		return () => {
			receivedListener.current?.remove();
			responseListener.current?.remove();
		};
	}, [router]);
}

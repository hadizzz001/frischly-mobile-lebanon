import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * useAppleAuth
 *
 * Sign in with Apple — required by App Store Review Guideline 4.8 as an
 * equivalent login option wherever a third-party login service (Google) is
 * offered. Apple's flow limits data collection to name + email, lets the user
 * hide their real email (Hide My Email relay) and does not track the user for
 * advertising.
 *
 * The native module only exists on iOS 13+ in a real build (not Expo Go on
 * Android / web), so it is lazily required and `isAvailable` gates the UI.
 */

type AppleAuthModule = typeof import("expo-apple-authentication");

const isExpoGo = Constants.appOwnership === "expo";

let appleModule: AppleAuthModule | null = null;
if (Platform.OS === "ios") {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		appleModule = require("expo-apple-authentication");
	} catch {
		appleModule = null;
	}
}

export type AppleCredentialPayload = {
	identityToken: string;
	authorizationCode?: string | null;
	userId?: string | null;
	email?: string | null;
	fullName?: string | null;
};

export function useAppleAuth(
	onCredential: (payload: AppleCredentialPayload) => void | Promise<void>,
	onError?: (message: string, rawError: unknown) => void,
) {
	const [isAvailable, setIsAvailable] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			if (Platform.OS !== "ios" || !appleModule) {
				setIsAvailable(false);
				return;
			}
			try {
				const available = await appleModule.isAvailableAsync();
				if (!cancelled) setIsAvailable(available);
			} catch {
				if (!cancelled) setIsAvailable(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const signInAsync = async () => {
		if (!appleModule) {
			onError?.(
				isExpoGo
					? "Sign in with Apple is not available in Expo Go."
					: "Sign in with Apple is not available on this device.",
				new Error("expo-apple-authentication unavailable"),
			);
			return;
		}
		try {
			const credential = await appleModule.signInAsync({
				requestedScopes: [
					appleModule.AppleAuthenticationScope.FULL_NAME,
					appleModule.AppleAuthenticationScope.EMAIL,
				],
			});

			if (!credential.identityToken) {
				onError?.(
					"Apple didn't return a sign-in token. Please try again.",
					credential,
				);
				return;
			}

			// Apple only sends the name/email on the very first authorization.
			const fullName = [
				credential.fullName?.givenName,
				credential.fullName?.familyName,
			]
				.filter(Boolean)
				.join(" ")
				.trim();

			await onCredential({
				identityToken: credential.identityToken,
				authorizationCode: credential.authorizationCode ?? null,
				userId: credential.user ?? null,
				email: credential.email ?? null,
				fullName: fullName || null,
			});
		} catch (error) {
			const code = (error as { code?: string })?.code;
			// User dismissed the native sheet — not an error worth surfacing.
			if (code === "ERR_REQUEST_CANCELED" || code === "ERR_CANCELED") return;
			const message =
				(error as { message?: string })?.message || "Apple sign-in failed";
			onError?.(code ? `${message} (code ${code})` : message, error);
		}
	};

	return { isAvailable, signInAsync };
}

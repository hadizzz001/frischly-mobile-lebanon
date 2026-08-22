import {
    GOOGLE_IOS_CLIENT_ID,
    GOOGLE_WEB_CLIENT_ID,
} from "@/constants/api";
import type { GoogleSigninModule } from "@/types/hooks/useGoogleAuth.types";
import Constants from "expo-constants";
import { useEffect, useState } from "react";

// The native Google Sign-In SDK is NOT available in Expo Go — it only exists in
// a development/production build. Importing it eagerly crashes Expo Go with
// "RNGoogleSignin could not be found". So we detect Expo Go and lazy-require the
// module only when it's actually usable.
const isExpoGo = Constants.appOwnership === "expo";

let googleModule: GoogleSigninModule | null = null;
if (!isExpoGo) {
	try {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		googleModule = require("@react-native-google-signin/google-signin");
	} catch {
		googleModule = null;
	}
}

/**
 * Turns any thrown value (native module error, JS error, etc.) into a
 * human-readable string that includes the native error code when present.
 * Google Sign-In errors on Android are almost always a numeric `code`
 * (e.g. "10" = DEVELOPER_ERROR, usually a SHA-1/OAuth client mismatch,
 * "12501" = user cancelled, "7" = NETWORK_ERROR) with little else useful in
 * `message`, so we surface the code prominently.
 */
function describeGoogleError(error: unknown): string {
	if (error && typeof error === "object") {
		const code = (error as { code?: unknown }).code;
		const message =
			(error as { message?: unknown }).message ||
			(error as { nativeErrorMessage?: unknown }).nativeErrorMessage;
		if (code !== undefined) {
			return `${message ? String(message) : "Google sign-in error"} (code ${code})`;
		}
		if (message) return String(message);
	}
	if (error instanceof Error) return error.message;
	return typeof error === "string" ? error : "Unknown Google sign-in error";
}

/**
 * useGoogleAuth
 *
 * Uses the **native** Google Sign-In SDK (`@react-native-google-signin`).
 * Opens the native Google account picker (not blocked by Google's OAuth 2.0
 * in-app-browser policy) and returns the Google **ID token**, which is sent to
 * the backend (`POST /auth/google`).
 *
 * `isReady` is false in Expo Go / when the native module or web client ID is
 * missing, so the UI can disable the button.
 *
 * `onError` is always called (never thrown/swallowed) whenever something goes
 * wrong — including native SDK failures like DEVELOPER_ERROR (SHA-1 / OAuth
 * client mismatch, common on Play Store builds signed with Play App Signing)
 * — so the UI can always show the user *something* instead of silently doing
 * nothing.
 */
export function useGoogleAuth(
	onToken: (idToken: string) => void | Promise<void>,
	onError?: (message: string, rawError: unknown) => void,
) {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!googleModule) {
			console.warn("[useGoogleAuth] native module not available (Expo Go or not installed)");
			setIsReady(false);
			return;
		}
		if (!GOOGLE_WEB_CLIENT_ID) {
			console.warn("[useGoogleAuth] GOOGLE_WEB_CLIENT_ID is missing");
			setIsReady(false);
			return;
		}
		try {
			googleModule.GoogleSignin.configure({
				// The web client ID makes the returned ID token's audience match what
				// the backend validates.
				webClientId: GOOGLE_WEB_CLIENT_ID,
				iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
				offlineAccess: false,
			});
			setIsReady(true);
		} catch (error) {
			console.warn("[useGoogleAuth] configure() threw", error);
			setIsReady(false);
		}
	}, []);

	const promptAsync = async () => {
		if (!googleModule) {
			onError?.(
				"Google Sign-In is not available in this build.",
				new Error("googleModule is null"),
			);
			return;
		}
		const { GoogleSignin, isErrorWithCode, statusCodes } = googleModule;
		try {
			await GoogleSignin.hasPlayServices({
				showPlayServicesUpdateDialog: true,
			});
			// Force the native account picker to show every time instead of silently
			// reusing the last signed-in Google account. Without this, signIn()
			// returns the cached account and the user can never switch to a
			// different Google account from the register/login screen.
			try {
				await GoogleSignin.signOut();
			} catch {
				// Ignore — signOut() throws if no session is cached, which is fine.
			}
			const response = await GoogleSignin.signIn();

			// Support both v13+ ({ data: { idToken } }) and older ({ idToken }) shapes.
			const idToken =
				(response as { data?: { idToken?: string } })?.data?.idToken ||
				(response as { idToken?: string })?.idToken;

			if (idToken) {
				await onToken(idToken);
			} else {
				console.warn("[useGoogleAuth] signIn() resolved without an idToken", response);
				onError?.(
					"Google didn't return a sign-in token. Please try again.",
					response,
				);
			}
		} catch (error) {
			console.warn("[useGoogleAuth] error during sign-in", error);
			if (
				isErrorWithCode(error) &&
				(error.code === statusCodes.SIGN_IN_CANCELLED ||
					error.code === statusCodes.IN_PROGRESS)
			) {
				// User cancelled or a sign-in is already in progress — ignore.
				return;
			}
			onError?.(describeGoogleError(error), error);
		}
	};

	return {
		isReady,
		promptAsync,
	};
}

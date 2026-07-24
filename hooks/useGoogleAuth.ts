import {
    GOOGLE_IOS_CLIENT_ID,
    GOOGLE_WEB_CLIENT_ID,
} from "@/constants/api";
import Constants from "expo-constants";
import { useEffect, useState } from "react";

// The native Google Sign-In SDK is NOT available in Expo Go — it only exists in
// a development/production build. Importing it eagerly crashes Expo Go with
// "RNGoogleSignin could not be found". So we detect Expo Go and lazy-require the
// module only when it's actually usable.
const isExpoGo = Constants.appOwnership === "expo";

type GoogleSigninModule = {
	GoogleSignin: {
		configure: (opts: Record<string, unknown>) => void;
		hasPlayServices: (opts?: Record<string, unknown>) => Promise<boolean>;
		signIn: () => Promise<unknown>;
		signOut: () => Promise<unknown>;
	};
	isErrorWithCode: (e: unknown) => e is { code: string };
	statusCodes: { SIGN_IN_CANCELLED: string; IN_PROGRESS: string };
};

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
 * useGoogleAuth
 *
 * Uses the **native** Google Sign-In SDK (`@react-native-google-signin`).
 * Opens the native Google account picker (not blocked by Google's OAuth 2.0
 * in-app-browser policy) and returns the Google **ID token**, which is sent to
 * the backend (`POST /auth/google`).
 *
 * `isReady` is false in Expo Go / when the native module or web client ID is
 * missing, so the UI can disable the button.
 */
export function useGoogleAuth(onToken: (idToken: string) => void | Promise<void>) {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (!googleModule || !GOOGLE_WEB_CLIENT_ID) {
			setIsReady(false);
			return;
		}
		googleModule.GoogleSignin.configure({
			// The web client ID makes the returned ID token's audience match what
			// the backend validates.
			webClientId: GOOGLE_WEB_CLIENT_ID,
			iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
			offlineAccess: false,
		});
		setIsReady(true);
	}, []);

	const promptAsync = async () => {
		if (!googleModule) return;
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
			}
		} catch (error) {
			if (
				isErrorWithCode(error) &&
				(error.code === statusCodes.SIGN_IN_CANCELLED ||
					error.code === statusCodes.IN_PROGRESS)
			) {
				// User cancelled or a sign-in is already in progress — ignore.
				return;
			}
			throw error;
		}
	};

	return {
		isReady,
		promptAsync,
	};
}

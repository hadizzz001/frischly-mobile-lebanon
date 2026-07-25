// Centralized API configuration
// Reads from Expo public env vars so different builds (dev/staging/prod)
// can point at different backends without code changes.
//
// Set EXPO_PUBLIC_API_BASE_URL in your .env file, e.g.:
//   EXPO_PUBLIC_API_BASE_URL=https://freshlylb.onrender.com

const FALLBACK_BASE_URL = "https://freshlylb.onrender.com";

export const SERVER_BASE_URL: string =
	process.env.EXPO_PUBLIC_API_BASE_URL || FALLBACK_BASE_URL;

export const API_BASE_URL: string = `${SERVER_BASE_URL}/api`;

export const API_TIMEOUT_MS: number = Number(
	process.env.EXPO_PUBLIC_API_TIMEOUT_MS || 30000,
);

// Google OAuth client IDs. Create these in Google Cloud Console
// (APIs & Services → Credentials) and set them in your .env file:
//   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...apps.googleusercontent.com
//   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...apps.googleusercontent.com
//   EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...apps.googleusercontent.com
// The web client id is also used as the backend audience (GOOGLE_CLIENT_ID).
export const GOOGLE_WEB_CLIENT_ID: string =
	process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const GOOGLE_IOS_CLIENT_ID: string =
	process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
export const GOOGLE_ANDROID_CLIENT_ID: string =
	process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";

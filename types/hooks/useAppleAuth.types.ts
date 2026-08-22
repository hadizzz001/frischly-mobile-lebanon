export type AppleAuthModule = typeof import("expo-apple-authentication");

export type AppleCredentialPayload = {
	identityToken: string;
	authorizationCode?: string | null;
	userId?: string | null;
	email?: string | null;
	fullName?: string | null;
};

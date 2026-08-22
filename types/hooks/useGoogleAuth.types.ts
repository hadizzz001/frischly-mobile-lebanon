export type GoogleSigninModule = {
	GoogleSignin: {
		configure: (opts: Record<string, unknown>) => void;
		hasPlayServices: (opts?: Record<string, unknown>) => Promise<boolean>;
		signIn: () => Promise<unknown>;
		signOut: () => Promise<unknown>;
	};
	isErrorWithCode: (e: unknown) => e is { code: string };
	statusCodes: { SIGN_IN_CANCELLED: string; IN_PROGRESS: string };
};

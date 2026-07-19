import { httpClient } from "./httpClient";

// Public (unauthenticated) app settings, including the admin / main-store
// serving cities used to scope the main store's visibility per city.
export const SettingsService = {
	getPublic: () =>
		httpClient.get<Record<string, unknown>>("/settings/public"),
};

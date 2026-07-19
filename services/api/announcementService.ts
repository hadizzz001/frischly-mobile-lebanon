import { httpClient } from "./httpClient";
import type { Announcement } from "@/types/models";

export const AnnouncementService = {
	activePublic: () =>
		httpClient.get<Announcement[]>("/announcements/public/active"),
};

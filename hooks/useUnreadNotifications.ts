import { useCallback, useEffect, useState } from "react";
import { AppState, DeviceEventEmitter } from "react-native";

import { INBOX_CHANGED } from "@/constants/events";
import { AnnouncementService } from "@/services/api";
import { countUnread } from "@/utils/notificationInbox";

/**
 * Unread badge count for the header bell: unread push notifications in the
 * local inbox + active announcements the shopper hasn't opened yet.
 * Recounts whenever the inbox changes or the app returns to the foreground.
 */
export function useUnreadNotifications(): number {
	const [count, setCount] = useState(0);

	const refresh = useCallback(async () => {
		try {
			const res = await AnnouncementService.activePublic();
			const list = Array.isArray(res?.data) ? res.data : [];
			setCount(await countUnread(list.map((a) => String(a._id))));
		} catch {
			setCount(await countUnread([]));
		}
	}, []);

	useEffect(() => {
		refresh();
		const sub = DeviceEventEmitter.addListener(INBOX_CHANGED, refresh);
		const app = AppState.addEventListener("change", (s) => {
			if (s === "active") refresh();
		});
		return () => {
			sub.remove();
			app.remove();
		};
	}, [refresh]);

	return count;
}

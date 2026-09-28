// Local notification inbox.
//
// The backend has no per-user notification history endpoint, so the app keeps
// its own: every push notification that reaches the device (foreground,
// background tap, cold start) is appended here, and store-wide announcements
// are tracked by id so the bell badge can count what the shopper hasn't seen.
// Everything is persisted in AsyncStorage; INBOX_CHANGED fires on every write
// so the header bell re-renders immediately.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeviceEventEmitter } from "react-native";

import { INBOX_CHANGED } from "@/constants/events";

const INBOX_KEY = "notif:inbox";
const SEEN_ANNOUNCEMENTS_KEY = "notif:seenAnnouncements";
const MAX_INBOX = 100;

export interface InboxItem {
	id: string;
	title: string;
	body: string;
	/** ISO timestamp. */
	receivedAt: string;
	read: boolean;
	/** Raw push data payload (orderId, route, …). */
	data?: Record<string, unknown>;
	/** "order" when the payload carries an order id, otherwise "general". */
	kind: "order" | "general";
}

const readJson = async <T,>(key: string, fallback: T): Promise<T> => {
	try {
		const raw = await AsyncStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
};

const emit = () => DeviceEventEmitter.emit(INBOX_CHANGED);

export const getInbox = (): Promise<InboxItem[]> => readJson<InboxItem[]>(INBOX_KEY, []);

/** Append a received push notification (de-duplicated by id). */
export const addToInbox = async (item: {
	id?: string | null;
	title?: string | null;
	body?: string | null;
	data?: Record<string, unknown> | null;
}): Promise<void> => {
	const inbox = await getInbox();
	const id = String(item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
	if (inbox.some((x) => x.id === id)) return;
	const data = item.data || undefined;
	const hasOrder = !!(data && (data.orderId || data.order_id));
	const next: InboxItem[] = [
		{
			id,
			title: String(item.title || ""),
			body: String(item.body || ""),
			receivedAt: new Date().toISOString(),
			read: false,
			data,
			kind: hasOrder ? ("order" as const) : ("general" as const),
		},
		...inbox,
	].slice(0, MAX_INBOX);
	await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(next));
	emit();
};

export const markInboxRead = async (ids?: string[]): Promise<void> => {
	const inbox = await getInbox();
	const next = inbox.map((x) => (!ids || ids.includes(x.id) ? { ...x, read: true } : x));
	await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(next));
	emit();
};

export const clearInbox = async (): Promise<void> => {
	await AsyncStorage.removeItem(INBOX_KEY);
	emit();
};

export const getSeenAnnouncementIds = (): Promise<string[]> =>
	readJson<string[]>(SEEN_ANNOUNCEMENTS_KEY, []);

export const markAnnouncementsSeen = async (ids: string[]): Promise<void> => {
	const seen = new Set(await getSeenAnnouncementIds());
	ids.forEach((id) => seen.add(String(id)));
	await AsyncStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify([...seen].slice(-200)));
	emit();
};

/** Unread count = unread pushes + announcements never opened. */
export const countUnread = async (announcementIds: string[]): Promise<number> => {
	const [inbox, seen] = await Promise.all([getInbox(), getSeenAnnouncementIds()]);
	const seenSet = new Set(seen);
	const unreadPush = inbox.filter((x) => !x.read).length;
	const unreadAnnouncements = announcementIds.filter((id) => !seenSet.has(String(id))).length;
	return unreadPush + unreadAnnouncements;
};

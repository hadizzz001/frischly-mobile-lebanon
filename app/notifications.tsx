import { useRouter } from "expo-router";
import { Megaphone, Package } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/components/ui/BackButton";
import EmptyState from "@/components/ui/EmptyState";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { AnnouncementService, OrderService } from "@/services/api";
import { styles } from "@/styles/app/notifications.styles";
import type { Announcement, Order } from "@/types";
import { interpolate } from "@/utils/i18n";
import {
	getInbox,
	getSeenAnnouncementIds,
	type InboxItem,
	markAnnouncementsSeen,
	markInboxRead,
} from "@/utils/notificationInbox";
import { isSignedIn } from "@/utils/userAddress";

type Tab = "announcements" | "orders";

type Row =
	| { kind: "announcement"; id: string; title: string; body: string; at?: string; unread: boolean }
	| { kind: "push"; id: string; title: string; body: string; at: string; unread: boolean; orderId?: string }
	| { kind: "order"; id: string; title: string; body: string; at?: string; unread: false; orderId: string };

// Notification inbox: store-wide announcements (from the API, read-state kept
// locally) and order updates (received pushes + the shopper's live orders).
export default function NotificationsScreen() {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const [tab, setTab] = useState<Tab>("announcements");
	const [loading, setLoading] = useState(true);
	const [announcements, setAnnouncements] = useState<Announcement[]>([]);
	const [seen, setSeen] = useState<Set<string>>(new Set());
	const [inbox, setInbox] = useState<InboxItem[]>([]);
	const [orders, setOrders] = useState<Order[]>([]);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const [ann, seenIds, box, signedIn] = await Promise.all([
				AnnouncementService.activePublic().catch(() => null),
				getSeenAnnouncementIds(),
				getInbox(),
				isSignedIn(),
			]);
			setAnnouncements(Array.isArray(ann?.data) ? ann!.data : []);
			setSeen(new Set(seenIds));
			setInbox(box);
			if (signedIn) {
				const res = await OrderService.list().catch(() => null);
				setOrders(Array.isArray(res?.data) ? res!.data : []);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// Opening a tab marks its content as read (the badge clears immediately).
	useEffect(() => {
		if (loading) return;
		if (tab === "announcements" && announcements.length) {
			markAnnouncementsSeen(announcements.map((a) => String(a._id)));
			setSeen(new Set(announcements.map((a) => String(a._id))));
		}
		if (tab === "orders") {
			const ids = inbox.filter((x) => x.kind === "order" && !x.read).map((x) => x.id);
			if (ids.length) markInboxRead(ids);
		}
	}, [tab, loading, announcements, inbox]);

	const relative = (iso?: string) => {
		if (!iso) return "";
		const diff = Math.max(0, Date.now() - new Date(iso).getTime());
		const m = Math.floor(diff / 60000);
		if (m < 1) return t("justNow");
		if (m < 60) return interpolate(t("minutesAgo"), { n: m });
		const h = Math.floor(m / 60);
		if (h < 24) return interpolate(t("hoursAgo"), { n: h });
		return interpolate(t("daysAgo"), { n: Math.floor(h / 24) });
	};

	const statusLabel = (status: string) => {
		const key = String(status || "").replace(/\s+/g, "");
		const map: Record<string, string> = {
			pending: "pending",
			confirmed: "confirmed",
			preparing: "preparing",
			processing: "processing",
			shipped: "shipped",
			OnTheWay: "onTheWay",
			ontheway: "onTheWay",
			delivered: "delivered",
			cancelled: "cancelled",
		};
		return t(map[key] || map[key.toLowerCase()] || status);
	};

	const rows = useMemo<Row[]>(() => {
		if (tab === "announcements") {
			const pushes: Row[] = inbox
				.filter((x) => x.kind === "general")
				.map((x) => ({ kind: "push", id: x.id, title: x.title, body: x.body, at: x.receivedAt, unread: !x.read }));
			const anns: Row[] = announcements.map((a) => ({
				kind: "announcement",
				id: String(a._id),
				title: td(a.title || ""),
				body: td(a.description || a.message || a.text || ""),
				at: (a as { createdAt?: string }).createdAt,
				unread: !seen.has(String(a._id)),
			}));
			return [...pushes, ...anns];
		}
		const pushes: Row[] = inbox
			.filter((x) => x.kind === "order")
			.map((x) => ({
				kind: "push",
				id: x.id,
				title: x.title,
				body: x.body,
				at: x.receivedAt,
				unread: !x.read,
				orderId: String(x.data?.orderId ?? x.data?.order_id ?? ""),
			}));
		const live: Row[] = orders
			.slice()
			.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
			.slice(0, 20)
			.map((o) => ({
				kind: "order",
				id: `order-${o._id}`,
				title: interpolate(t("orderStatusLine"), {
					number: o.orderNumber || String(o._id).slice(-6),
					status: statusLabel(String(o.status)),
				}),
				body: `${t("total")}: $${Number(o.total || 0).toFixed(2)}`,
				at: o.updatedAt || o.createdAt,
				unread: false,
				orderId: String(o._id),
			}));
		return [...pushes, ...live];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tab, inbox, announcements, seen, orders, td]);

	const openRow = (row: Row) => {
		const orderId = row.kind !== "announcement" ? row.orderId : undefined;
		if (orderId) router.push(`/track/${orderId}` as never);
	};

	return (
		<SafeAreaView edges={["bottom"]} style={styles.safeArea}>
			<View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
				<BackButton />
				<Text style={styles.title}>{t("notifications")}</Text>
				<Pressable onPress={() => markInboxRead().then(load)} hitSlop={8}>
					<Text style={styles.markRead}>{t("markAllRead")}</Text>
				</Pressable>
			</View>
			<View style={[styles.tabs, isRTL && { flexDirection: "row-reverse" }]}>
				{(["announcements", "orders"] as Tab[]).map((key) => (
					<Pressable key={key} style={[styles.tab, tab === key && styles.tabActive]} onPress={() => setTab(key)}>
						<Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
							{key === "announcements" ? t("announcements") : t("orderUpdates")}
						</Text>
					</Pressable>
				))}
			</View>

			{loading ? (
				<ActivityIndicator color={colors.primary} style={styles.loader} />
			) : (
				<FlatList
					data={rows}
					keyExtractor={(r) => r.id}
					contentContainerStyle={styles.list}
					renderItem={({ item }) => {
						const Icon = tab === "announcements" ? Megaphone : Package;
						const tappable = item.kind !== "announcement" && !!item.orderId;
						return (
							<Pressable
								onPress={() => openRow(item)}
								disabled={!tappable}
								style={({ pressed }) => [
									styles.card,
									item.unread && styles.cardUnread,
									isRTL && { flexDirection: "row-reverse" },
									pressed && tappable && { opacity: 0.85 },
								]}
							>
								<View style={styles.iconPill}>
									<Icon size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textSecondary} />
								</View>
								<View style={styles.cardBody}>
									{item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
									{item.body ? <Text style={styles.cardText}>{item.body}</Text> : null}
									{item.at ? <Text style={styles.cardMeta}>{relative(item.at)}</Text> : null}
									{tappable ? <Text style={styles.cardLink}>{t("viewOrder")}</Text> : null}
								</View>
							</Pressable>
						);
					}}
					ListEmptyComponent={
						<EmptyState
							illustration="bell"
							title={tab === "announcements" ? t("noAnnouncements") : t("noOrderUpdates")}
							description={tab === "announcements" ? t("noAnnouncementsBody") : t("noOrderUpdatesBody")}
						/>
					}
				/>
			)}
		</SafeAreaView>
	);
}

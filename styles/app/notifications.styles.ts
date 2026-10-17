import { StyleSheet } from "react-native";

import { PAGE_END_SPACE } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.surface },
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		backgroundColor: colors.background,
	},
	title: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.text },
	markRead: { fontSize: 13, fontWeight: "600", color: colors.link, paddingHorizontal: spacing.sm },
	tabs: {
		flexDirection: "row",
		backgroundColor: colors.background,
		paddingHorizontal: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	tab: {
		flex: 1,
		alignItems: "center",
		paddingVertical: spacing.md,
		borderBottomWidth: 2,
		borderBottomColor: "transparent",
	},
	tabActive: { borderBottomColor: colors.primary },
	tabText: { fontSize: 14, fontWeight: "600", color: colors.textMuted },
	tabTextActive: { color: colors.text },
	list: { padding: spacing.md, paddingBottom: PAGE_END_SPACE, gap: spacing.sm, flexGrow: 1 },
	card: {
		flexDirection: "row",
		gap: spacing.md,
		padding: spacing.md,
		borderRadius: radius.card,
		backgroundColor: colors.background,
		...shadow.card,
	},
	cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
	iconPill: {
		width: 40,
		height: 40,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
	},
	cardBody: { flex: 1 },
	cardTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
	cardText: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, marginTop: 2 },
	cardMeta: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
	cardLink: { fontSize: 13, fontWeight: "600", color: colors.link, marginTop: spacing.xs },
	loader: { paddingVertical: spacing.xl },
});

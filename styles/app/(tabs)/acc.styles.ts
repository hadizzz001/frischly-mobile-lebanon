import { StyleSheet } from "react-native";

import { PAGE_END_SPACE } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.surface },
	scrollContent: { paddingBottom: PAGE_END_SPACE, flexGrow: 1 },

	// --- header -------------------------------------------------------------------
	header: {
		alignItems: "center",
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.md,
		backgroundColor: colors.background,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	avatar: {
		width: 72,
		height: 72,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceAlt,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: spacing.sm,
	},
	name: { fontSize: 20, fontWeight: "700", color: colors.text, textAlign: "center" },
	subtitle: { fontSize: 14, color: colors.textMuted, textAlign: "center", marginTop: 2 },

	// --- grouped sections ---------------------------------------------------------
	sectionTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
		marginHorizontal: spacing.md,
	},
	group: {
		marginHorizontal: spacing.md,
		borderRadius: radius.card,
		backgroundColor: colors.background,
		...shadow.card,
		overflow: "hidden",
	},
	tile: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		minHeight: 60,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	tileLast: { borderBottomWidth: 0 },
	tilePressed: { backgroundColor: colors.surface },
	iconPill: {
		width: 40,
		height: 40,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
	},
	tileBody: { flex: 1 },
	tileLabel: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
	tileValue: { fontSize: 15, color: colors.text, fontWeight: "500", marginTop: 2 },
	tileTitle: { fontSize: 15, color: colors.text, fontWeight: "600" },
	tileHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
	tag: {
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
		borderRadius: radius.badge,
		backgroundColor: colors.primarySoft,
	},
	tagText: { fontSize: 11, fontWeight: "700", color: colors.primaryPressed },
	segmented: {
		flexDirection: "row",
		backgroundColor: colors.surfaceAlt,
		borderRadius: radius.badge,
		padding: 2,
	},
	segment: {
		paddingHorizontal: spacing.md,
		height: 32,
		borderRadius: radius.badge - 2,
		alignItems: "center",
		justifyContent: "center",
	},
	segmentActive: { backgroundColor: colors.background, ...shadow.card },
	segmentText: { fontSize: 13, fontWeight: "600", color: colors.textMuted },
	segmentTextActive: { color: colors.text },

	// --- account actions ------------------------------------------------------------
	actions: { marginHorizontal: spacing.md, marginTop: spacing.lg, gap: spacing.sm },
	destructiveText: { color: colors.danger },

	// --- guest ------------------------------------------------------------------------
	guestActions: { width: "100%", maxWidth: 320, gap: spacing.sm, marginTop: spacing.lg },

	// --- sheets ---------------------------------------------------------------------------
	sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
	sheetBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.md },
	sheetActions: { gap: spacing.sm },
});

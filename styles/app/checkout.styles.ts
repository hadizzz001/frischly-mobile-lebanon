import { StyleSheet } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	container: { flex: 1 },
	scrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
	flex1: { flex: 1 },
	loadingContainer: {
		flex: 1,
		gap: spacing.sm,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	topBarTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.text },
	heading: {
		fontSize: 14,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
	},
	text: { fontSize: 13, color: colors.textMuted },

	// --- address card ---------------------------------------------------------------
	addressCard: {
		borderRadius: radius.card,
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.md,
		...shadow.card,
	},
	addressCardMissing: { borderColor: colors.warning, backgroundColor: colors.warningSoft },
	addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
	addressIcon: {
		width: 40,
		height: 40,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
	},
	addressTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
	addressSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

	// --- payment ------------------------------------------------------------------------
	paymentOptions: { flexDirection: "row", gap: spacing.md },
	paymentOption: {
		flex: 1,
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.md,
		borderRadius: radius.card,
		borderWidth: 1.5,
		borderColor: colors.borderStrong,
		backgroundColor: colors.background,
	},
	paymentOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
	paymentOptionText: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, textAlign: "center" },
	paymentOptionTextSelected: { color: colors.text },

	// --- promo ------------------------------------------------------------------------------
	promoCodeContainer: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
	applyButton: { height: 52, minHeight: 52, paddingHorizontal: spacing.lg },
	promoError: { marginTop: spacing.xs, fontSize: 12, color: colors.danger, fontWeight: "600" },
	promoApplied: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.card,
		backgroundColor: colors.successSoft,
	},
	promoAppliedText: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.text },

	// --- summary ---------------------------------------------------------------------------
	sourceBadge: {
		alignSelf: "flex-start",
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.sm,
		height: 28,
		borderRadius: radius.badge,
		backgroundColor: colors.primarySoft,
		marginBottom: spacing.sm,
	},
	sourceBadgeText: { fontSize: 12, fontWeight: "700", color: colors.primaryPressed },
	itemsCard: {
		borderRadius: radius.card,
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.border,
		paddingHorizontal: spacing.md,
		...shadow.card,
	},
	cartItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	cartItemLast: { borderBottomWidth: 0 },
	cartImageWrap: {
		width: 56,
		height: 56,
		borderRadius: radius.badge,
		backgroundColor: colors.surfaceAlt,
		padding: spacing.xs,
	},
	cartImage: { width: "100%", height: "100%" },
	itemName: { fontSize: 14, fontWeight: "600", color: colors.text },
	price: { fontSize: 14, fontWeight: "700", color: colors.text },
	removeBtn: { padding: spacing.xs },

	// --- sticky bar ---------------------------------------------------------------------------
	stickyBar: {
		backgroundColor: colors.background,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		...shadow.sheet,
	},
	summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
	summaryLabel: { fontSize: 13, color: colors.textMuted },
	summaryValue: { fontSize: 13, color: colors.text, fontWeight: "500" },
	summaryDiscount: { color: colors.success },
	totalRow: { marginTop: spacing.xs, marginBottom: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
	totalLabel: { fontSize: 15, fontWeight: "700", color: colors.text },
	totalValue: { fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "right" },
	totalLbp: { fontSize: 12, color: colors.textMuted, textAlign: "right" },

	// --- sheets ---------------------------------------------------------------------------------
	sheetTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
	sheetBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.md },
	sheetActions: { gap: spacing.sm },
});

import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	body: { alignItems: "center", paddingTop: spacing.sm },
	// Pulsating waveform: five bars that scale on staggered loops.
	waveRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		height: 72,
		marginVertical: spacing.md,
	},
	waveBar: {
		width: 8,
		height: 56,
		borderRadius: radius.full,
		backgroundColor: colors.primary,
	},
	waveBarIdle: { backgroundColor: colors.borderStrong },
	status: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		textAlign: "center",
	},
	hint: {
		marginTop: spacing.xs,
		fontSize: 14,
		color: colors.textMuted,
		textAlign: "center",
	},
	transcript: {
		marginTop: spacing.sm,
		fontSize: 15,
		fontStyle: "italic",
		color: colors.textSecondary,
		textAlign: "center",
	},
	errorBox: {
		marginTop: spacing.md,
		flexDirection: "row",
		gap: spacing.sm,
		alignItems: "flex-start",
		backgroundColor: colors.warningSoft,
		borderRadius: radius.card,
		padding: spacing.md,
	},
	errorText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.text },
	// Hold-to-talk mic. Grows and darkens while held so the shopper can feel
	// the recording state without reading the label.
	micButton: {
		marginTop: spacing.md,
		width: 80,
		height: 80,
		borderRadius: radius.full,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	micButtonActive: {
		backgroundColor: colors.primaryDark,
		transform: [{ scale: 1.15 }],
	},
	timer: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
	permissionIcon: {
		width: 72,
		height: 72,
		borderRadius: radius.full,
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: spacing.md,
	},
	permissionBody: {
		fontSize: 14,
		lineHeight: 20,
		color: colors.textMuted,
		textAlign: "center",
		marginTop: spacing.sm,
		marginBottom: spacing.md,
		maxWidth: 320,
	},
	actions: { width: "100%", gap: spacing.sm, marginTop: spacing.sm },
	chipsTitle: {
		alignSelf: "flex-start",
		marginTop: spacing.lg,
		marginBottom: spacing.sm,
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	chipsRow: { gap: spacing.sm, paddingRight: spacing.md },
	chipsWrap: { width: "100%" },
});

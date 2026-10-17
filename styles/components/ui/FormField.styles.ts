import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { marginBottom: spacing.md, width: "100%" },
	label: {
		fontSize: 12,
		fontWeight: "600",
		color: colors.textMuted,
		marginBottom: spacing.xs + 2,
	},
	required: { color: colors.danger },
	box: {
		flexDirection: "row",
		alignItems: "center",
		minHeight: 52,
		borderRadius: radius.card,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		backgroundColor: colors.background,
		paddingHorizontal: spacing.md,
		gap: spacing.sm,
	},
	boxRTL: { flexDirection: "row-reverse" },
	boxFocused: { borderColor: colors.primary },
	boxError: { borderColor: colors.danger },
	boxDisabled: { backgroundColor: colors.surface },
	input: {
		flex: 1,
		fontSize: 16,
		color: colors.text,
		paddingVertical: 0,
		minHeight: 50,
	},
	inputRTL: { textAlign: "right" },
	textLTR: { textAlign: "left" },
	value: { flex: 1, fontSize: 16, color: colors.text },
	placeholder: { color: colors.textDisabled },
	prefix: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
	divider: { width: 1, height: 24, backgroundColor: colors.borderStrong },
	hint: { marginTop: spacing.xs, fontSize: 12, color: colors.textMuted },
	error: { marginTop: spacing.xs, fontSize: 12, color: colors.danger, fontWeight: "600" },
});

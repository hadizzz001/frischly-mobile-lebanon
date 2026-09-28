import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	base: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		minHeight: 48,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.card,
	},
	primary: { backgroundColor: colors.primary },
	secondary: {
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.borderStrong,
	},
	danger: { backgroundColor: colors.danger },
	ghost: { backgroundColor: "transparent", minHeight: 44 },
	disabled: { opacity: 0.5 },
	text: { fontSize: 16, fontWeight: "700" },
	textPrimary: { color: colors.primaryText },
	textSecondary: { color: colors.text },
	textDanger: { color: colors.textOnDark },
	textGhost: { color: colors.link, textDecorationLine: "underline" },
});

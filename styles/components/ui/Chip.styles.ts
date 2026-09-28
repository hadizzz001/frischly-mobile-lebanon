import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	chip: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		height: 36,
		borderRadius: radius.badge,
		backgroundColor: colors.surfaceAlt,
		borderWidth: 1,
		borderColor: "transparent",
	},
	chipSelected: {
		backgroundColor: colors.primary,
		borderColor: colors.primary,
	},
	chipDisabled: { opacity: 0.4 },
	label: {
		fontSize: 13,
		fontWeight: "600",
		color: colors.textSecondary,
	},
	labelSelected: { color: colors.primaryText },
	remove: { marginLeft: spacing.xs },
});

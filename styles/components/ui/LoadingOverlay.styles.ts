import { StyleSheet } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	scrim: {
		flex: 1,
		backgroundColor: colors.overlay,
		alignItems: "center",
		justifyContent: "center",
	},
	card: {
		minWidth: 140,
		paddingVertical: spacing.lg,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.card,
		backgroundColor: colors.background,
		alignItems: "center",
		gap: spacing.sm,
		...shadow.raised,
	},
	label: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: "center" },
});

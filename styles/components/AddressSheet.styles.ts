import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	mapButton: { marginBottom: spacing.md },
	pinRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		padding: spacing.md,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.md,
	},
	pinText: { flex: 1, fontSize: 14, color: colors.text, fontWeight: "600" },
	pinSub: { fontSize: 12, color: colors.textMuted },
	syncing: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
	syncingText: { fontSize: 12, color: colors.textMuted },
});

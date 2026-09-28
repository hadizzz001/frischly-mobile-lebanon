import { StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	scroll: { flexGrow: 1 },
	content: { flexGrow: 1 },
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
	},
	title: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.text },
	body: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
});

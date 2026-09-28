import { StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { flexGrow: 1 },
	title: { fontSize: 20, fontWeight: "700", color: colors.text },
	subtitle: { fontSize: 16, fontWeight: "700", color: colors.text, marginTop: spacing.md, marginBottom: spacing.xs },
	paragraph: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});

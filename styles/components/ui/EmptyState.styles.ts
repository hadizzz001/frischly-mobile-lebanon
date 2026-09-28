import { StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xl,
	},
	illustration: { width: 140, height: 140, marginBottom: spacing.lg },
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		textAlign: "center",
	},
	description: {
		marginTop: spacing.sm,
		fontSize: 14,
		lineHeight: 20,
		color: colors.textMuted,
		textAlign: "center",
		maxWidth: 320,
	},
	action: { marginTop: spacing.lg, alignSelf: "stretch", maxWidth: 320, width: "100%" },
	secondary: { marginTop: spacing.sm },
});

import { StyleSheet } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	background: {
		backgroundColor: colors.background,
		borderTopLeftRadius: radius.sheet,
		borderTopRightRadius: radius.sheet,
		...shadow.sheet,
	},
	handle: {
		backgroundColor: colors.borderStrong,
		width: 40,
		height: 4,
		borderRadius: radius.full,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		paddingBottom: spacing.md,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		flex: 1,
	},
	body: {
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.lg,
	},
	footer: {
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		backgroundColor: colors.background,
	},
});

import { StyleSheet } from "react-native";

import { GRID_GUTTER } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

// Floating "Order again" card, just above the bottom nav:
// [ [icon] title + subtitle [Repeat] ] [✕]
export const styles = StyleSheet.create({
	floating: {
		position: "absolute",
		left: GRID_GUTTER,
		right: GRID_GUTTER,
		bottom: spacing.md,
		zIndex: 20,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		paddingVertical: 10,
		paddingLeft: 12,
		paddingRight: spacing.xs,
		borderRadius: radius.card,
		backgroundColor: colors.background,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		...shadow.raised,
	},
	main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
	pressed: { opacity: 0.85 },
	iconCircle: {
		width: 40,
		height: 40,
		borderRadius: radius.full,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	textWrap: { flex: 1 },
	title: { fontSize: 15, lineHeight: 20, fontWeight: "700", color: colors.text },
	subtitle: { marginTop: 2, fontSize: 12, lineHeight: 16, color: colors.textMuted },
	action: {
		minWidth: 72,
		height: 36,
		paddingHorizontal: spacing.md,
		borderRadius: radius.badge,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	actionText: { fontSize: 13, fontWeight: "700", color: colors.primaryText },
	close: {
		width: 32,
		height: 32,
		borderRadius: radius.full,
		alignItems: "center",
		justifyContent: "center",
	},
});

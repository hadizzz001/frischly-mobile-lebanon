import { StyleSheet } from "react-native";

import { colors, radius, shadow } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: colors.background,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		...shadow.sheet,
	},
	tab: { flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48 },
	iconWrap: {
		width: 56,
		height: 36,
		borderRadius: radius.badge,
		alignItems: "center",
		justifyContent: "center",
	},
	iconWrapActive: { backgroundColor: colors.primarySoft },
	cartBadge: {
		position: "absolute",
		right: 4,
		top: -4,
		minWidth: 18,
		height: 18,
		paddingHorizontal: 4,
		borderRadius: radius.full,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.background,
	},
	cartBadgeText: { fontSize: 10, fontWeight: "700", color: colors.primaryText, lineHeight: 12 },
});

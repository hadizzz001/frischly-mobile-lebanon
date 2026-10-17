import { StyleSheet } from "react-native";

import { colors, icon, radius, shadow } from "@/constants/theme";

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
	glyph: { width: icon.sizeLarge, height: icon.sizeLarge },
	// Centred on the glyph's top-right corner (same placement as the bell's).
	cartBadge: {
		position: "absolute",
		right: -9,
		top: -7,
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

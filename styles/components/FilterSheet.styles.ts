import { StyleSheet } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	section: { marginBottom: spacing.lg },
	sectionTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: colors.textMuted,
		textTransform: "uppercase",
		letterSpacing: 0.5,
		marginBottom: spacing.sm,
	},
	chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
	chipsRow: { gap: spacing.sm, paddingRight: spacing.md },
	searchBox: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		height: 48,
		borderRadius: radius.sheet,
		backgroundColor: colors.surfaceAlt,
		paddingHorizontal: spacing.md,
	},
	searchInput: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 0 },
	priceLabels: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.xs,
	},
	priceLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
	sliderWrap: { alignItems: "center", paddingHorizontal: spacing.sm },
	marker: {
		width: 28,
		height: 28,
		borderRadius: radius.full,
		backgroundColor: colors.background,
		borderWidth: 2,
		borderColor: colors.primary,
		shadowColor: "#000",
		shadowOpacity: 0.12,
		shadowRadius: 4,
		shadowOffset: { width: 0, height: 2 },
		elevation: 3,
	},
	toggleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		minHeight: 48,
	},
	toggleLabel: { fontSize: 15, color: colors.text, fontWeight: "500" },
	resetText: { fontSize: 14, fontWeight: "600", color: colors.link },
	footerRow: { flexDirection: "row", gap: spacing.sm },
});

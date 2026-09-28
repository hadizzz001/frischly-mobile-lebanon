import { StyleSheet } from "react-native";

import { colors, hitSize, radius, shadow, spacing } from "@/constants/theme";

// Two-row Appbar: [logo · location/guest · bell · language] over a full-width
// search bar with the voice trigger as an inline suffix.
export const styles = StyleSheet.create({
	topNav: {
		backgroundColor: colors.background,
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.sm,
		zIndex: 100,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		height: 56,
		gap: spacing.sm,
	},
	rowReverse: { flexDirection: "row-reverse" },
	logo: { width: 44, height: 44 },

	// --- location pill (signed-in) --------------------------------------------
	locationButton: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		height: 40,
		paddingHorizontal: spacing.sm,
		borderRadius: radius.badge,
		backgroundColor: colors.surface,
	},
	locationTextWrap: { flex: 1 },
	locationLabel: { fontSize: 10, fontWeight: "600", color: colors.textMuted, lineHeight: 12 },
	locationText: { fontSize: 13, fontWeight: "700", color: colors.text, lineHeight: 16 },

	// --- guest chip -------------------------------------------------------------
	guestChip: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		height: 40,
		paddingHorizontal: spacing.md,
		borderRadius: radius.badge,
		backgroundColor: colors.primary,
	},
	guestChipText: { fontSize: 13, fontWeight: "700", color: colors.primaryText },

	// --- icon buttons -----------------------------------------------------------
	iconButton: {
		width: hitSize,
		height: hitSize,
		borderRadius: radius.full,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: {
		position: "absolute",
		top: 6,
		right: 6,
		minWidth: 18,
		height: 18,
		paddingHorizontal: 4,
		borderRadius: radius.full,
		backgroundColor: colors.danger,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.background,
	},
	badgeText: { fontSize: 10, fontWeight: "700", color: colors.textOnDark, lineHeight: 12 },

	// --- search bar -------------------------------------------------------------
	searchWrapper: {
		flexDirection: "row",
		alignItems: "center",
		height: 48,
		borderRadius: radius.sheet,
		backgroundColor: colors.surfaceAlt,
		paddingLeft: spacing.md,
		paddingRight: spacing.xs,
		gap: spacing.sm,
	},
	searchBox: {
		flex: 1,
		height: "100%",
		fontSize: 15,
		color: colors.text,
		paddingVertical: 0,
	},
	micButton: {
		width: 40,
		height: 40,
		borderRadius: radius.full,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.background,
		...shadow.card,
	},

	// --- language dropdown ------------------------------------------------------
	dropdownContainer: { position: "relative" },
	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		height: hitSize,
		paddingHorizontal: spacing.xs,
	},
	flag: { width: 22, height: 15, borderRadius: 3 },
	dropdownList: {
		position: "absolute",
		top: 48,
		right: 0,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		...shadow.raised,
		width: 150,
		zIndex: 200,
		paddingVertical: spacing.xs,
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: 10,
		paddingHorizontal: spacing.md,
	},
	dropdownText: { color: colors.text, fontSize: 14 },
	dropdownTextActive: { color: colors.primaryDark, fontWeight: "700" },
});

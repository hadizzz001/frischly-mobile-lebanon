import { StyleSheet } from "react-native";

import { colors, hitSize, icon, radius, shadow, spacing } from "@/constants/theme";

/** Height of the logo / location / bell / language row (the language menu opens right below it). */
export const HEADER_ROW_HEIGHT = 56;

// Search bar geometry: the mic is a circle concentric with the bar's rounded
// end, so it can never poke out of the bar's outline.
const SEARCH_BAR_HEIGHT = 48;
const MIC_SIZE = 36;
const MIC_INSET = (SEARCH_BAR_HEIGHT - MIC_SIZE) / 2;

// Two-row Appbar: [logo · location/guest · bell · language] over a full-width
// search bar with the voice trigger as an inline suffix.
export const styles = StyleSheet.create({
	// No zIndex: the language menu lives in its own modal layer now, and a
	// raised header drew over every bottom sheet's backdrop.
	topNav: {
		backgroundColor: colors.background,
		paddingHorizontal: spacing.md,
		paddingBottom: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		height: HEADER_ROW_HEIGHT,
		gap: spacing.sm,
	},
	rowReverse: { flexDirection: "row-reverse" },
	// As large as the row allows while keeping a little air above and below.
	logo: { width: 54, height: 54 },

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
	// Exactly the bell glyph's box, so the badge can be pinned to the glyph.
	bellGlyph: { width: icon.sizeLarge, height: icon.sizeLarge },
	// Centred on the glyph's top corner; the white ring separates it from the
	// bell's outline.
	badge: {
		position: "absolute",
		top: -7,
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
	badgeEnd: { right: -9 },
	badgeStart: { left: -9 },
	badgeText: { fontSize: 10, fontWeight: "700", color: colors.textOnDark, lineHeight: 12 },

	// --- search bar -------------------------------------------------------------
	searchWrapper: {
		flexDirection: "row",
		alignItems: "center",
		height: SEARCH_BAR_HEIGHT,
		borderRadius: SEARCH_BAR_HEIGHT / 2,
		backgroundColor: colors.surfaceAlt,
		paddingLeft: spacing.md,
		paddingRight: MIC_INSET,
		gap: spacing.sm,
	},
	// Arabic: search icon on the right, mic on the left.
	searchWrapperRTL: {
		flexDirection: "row-reverse",
		paddingLeft: MIC_INSET,
		paddingRight: spacing.md,
	},
	searchBox: {
		flex: 1,
		height: "100%",
		fontSize: 15,
		color: colors.text,
		paddingVertical: 0,
	},
	// A flat amber-tinted circle inside the bar (it used to be a white disc with
	// a drop shadow that stuck out of the bar's rounded outline).
	micButton: {
		width: MIC_SIZE,
		height: MIC_SIZE,
		borderRadius: MIC_SIZE / 2,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.primarySoft,
	},

	// --- language menu ----------------------------------------------------------
	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: 2,
		height: hitSize,
		paddingHorizontal: spacing.xs,
	},
	flag: { width: 22, height: 15, borderRadius: 3 },
	// Full-screen, transparent: a tap outside the menu closes it.
	menuBackdrop: { ...StyleSheet.absoluteFillObject },
	// Positioned by the header (top + the start/end edge) inside its modal.
	dropdownList: {
		position: "absolute",
		minWidth: 168,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		borderWidth: 1,
		borderColor: colors.border,
		...shadow.raised,
		paddingVertical: spacing.xs,
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		minHeight: hitSize,
		paddingHorizontal: spacing.md,
	},
	dropdownItemActive: { backgroundColor: colors.surface },
	dropdownText: { color: colors.text, fontSize: 14 },
	dropdownTextActive: { color: colors.primaryDark, fontWeight: "700" },
});

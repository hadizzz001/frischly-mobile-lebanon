import { StyleSheet } from "react-native";

import { PAGE_END_SPACE } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	// The global header above already clears the status bar and the bottom nav
	// clears the home indicator, so no safe-area insets here.
	content: {
		flexGrow: 1,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: PAGE_END_SPACE,
	},
	// Pulls the 44pt hit area toward the screen edge (either side) so the
	// chevron lines up with the title and fields below it.
	back: { marginHorizontal: -spacing.md, marginBottom: spacing.sm },
});

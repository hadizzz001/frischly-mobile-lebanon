import { StyleSheet } from "react-native";

import { PAGE_END_SPACE, REPEAT_ORDER_FLOATING_SPACE } from "@/constants/layout";
import { hitSize, colors, radius, spacing } from "@/constants/theme";

// MarketHome (a market's home page, also the home tab when it is the only
// store serving the shopper): the home screen's container/scroll styles (see
// styles/app/(tabs)/index.styles.ts) plus a slim in-flow bar with the back
// button and the market's logo + name.
export const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: colors.background },
	scrollContent: { paddingBottom: PAGE_END_SPACE },
	// While the floating "Order again" card shows, nothing may stay under it.
	scrollContentWithFloatingCard: { paddingBottom: PAGE_END_SPACE + REPEAT_ORDER_FLOATING_SPACE },
	// Empty market: the message is the entire page.
	emptyContent: { flexGrow: 1, justifyContent: "center" },

	topBar: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.xs,
		paddingVertical: spacing.xs,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
		backgroundColor: colors.background,
	},
	titleRow: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
	},
	logo: {
		width: 32,
		height: 32,
		borderRadius: radius.badge,
		backgroundColor: colors.surfaceAlt,
	},
	logoFallback: {
		width: 32,
		height: 32,
		borderRadius: radius.badge,
		backgroundColor: colors.primarySoft,
		alignItems: "center",
		justifyContent: "center",
	},
	logoFallbackText: { fontSize: 15, fontWeight: "700", color: colors.primaryDark },
	title: { flexShrink: 1, fontSize: 17, fontWeight: "700", color: colors.text },
	// Balances the back button so the title stays centred.
	topBarSpacer: { width: hitSize },
});

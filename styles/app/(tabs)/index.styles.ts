import { StyleSheet } from "react-native";

import { PAGE_END_SPACE, REPEAT_ORDER_FLOATING_SPACE } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	scrollContent: { paddingBottom: PAGE_END_SPACE },
	// While the floating "Order again" card shows, nothing may stay under it.
	scrollContentWithFloatingCard: { paddingBottom: PAGE_END_SPACE + REPEAT_ORDER_FLOATING_SPACE },
	// Region empty state: the message is the entire page.
	emptyContent: { flexGrow: 1, justifyContent: "center" },
});

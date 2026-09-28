import { StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	scrollContent: { paddingBottom: spacing.xl },
	// Region empty state: the message is the entire page.
	emptyContent: { flexGrow: 1, justifyContent: "center" },
});

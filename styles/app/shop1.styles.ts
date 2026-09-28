import { StyleSheet } from "react-native";

import { GRID_GUTTER, PRODUCT_GRID_GAP } from "@/constants/layout";
import { colors, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	container: { flex: 1, backgroundColor: colors.background },
	listContentPadding: { paddingHorizontal: GRID_GUTTER, flexGrow: 1 },
	skeletonWrap: { paddingTop: spacing.md },
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", color: colors.text },
	subcategoryTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		marginTop: spacing.md,
		marginBottom: spacing.md,
	},
	row: { flexDirection: "row", gap: PRODUCT_GRID_GAP, marginBottom: PRODUCT_GRID_GAP },
	floatingHeader: {
		backgroundColor: colors.background,
		paddingVertical: spacing.sm,
		paddingHorizontal: GRID_GUTTER,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	floatingHeaderText: { fontSize: 16, fontWeight: "700", color: colors.text },
});

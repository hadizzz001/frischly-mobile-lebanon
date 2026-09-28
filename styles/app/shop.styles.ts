import { StyleSheet } from "react-native";

import { GRID_GUTTER, PRODUCT_GRID_GAP } from "@/constants/layout";
import { colors, radius, spacing } from "@/constants/theme";

export const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: colors.background },
	container: { flex: 1, backgroundColor: colors.background },

	// --- top bar: back · category chips · filter --------------------------------
	categoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		gap: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	categoryBar: { flex: 1 },
	centerAlignItems: { alignItems: "center", gap: spacing.sm, paddingRight: spacing.sm },
	flex1PaddingH10: { flex: 1, paddingHorizontal: spacing.sm },
	marketNameTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
	filterBtn: {
		width: 44,
		height: 44,
		borderRadius: radius.card,
		backgroundColor: colors.surfaceAlt,
		alignItems: "center",
		justifyContent: "center",
	},
	filterBtnActive: { backgroundColor: colors.primary },
	filterBadge: {
		position: "absolute",
		top: -4,
		right: -4,
		minWidth: 18,
		height: 18,
		paddingHorizontal: 4,
		borderRadius: radius.full,
		backgroundColor: colors.text,
		alignItems: "center",
		justifyContent: "center",
	},
	filterBadgeText: { color: colors.textOnDark, fontSize: 10, fontWeight: "700" },

	subcategoryBar: { maxHeight: 52 },
	subcategoryScrollContent: {
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: GRID_GUTTER,
		paddingVertical: spacing.sm,
	},

	// --- grid -------------------------------------------------------------------------
	listContent: {
		paddingHorizontal: GRID_GUTTER,
		paddingTop: spacing.md,
		flexGrow: 1,
	},
	skeletonWrap: { paddingTop: spacing.md },
	// One row of the 3-column grid (FlatList columnWrapper / SectionList row).
	// flexDirection is explicit because the SectionList path builds its rows by
	// hand (FlatList's columnWrapper already lays out horizontally).
	searchRow: { flexDirection: "row", gap: PRODUCT_GRID_GAP, marginBottom: PRODUCT_GRID_GAP },
	footerLoader: { marginVertical: spacing.md },

	// --- global-search section headers -----------------------------------------------
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginTop: spacing.sm,
		marginBottom: spacing.md,
	},
	sectionHeaderText: {
		flexShrink: 1,
		fontSize: 16,
		fontWeight: "700",
		color: colors.text,
	},
	sectionHeaderCount: { fontSize: 13, color: colors.textMuted },

	// --- voice / multi-term search header ----------------------------------------
	voiceHeader: {
		marginBottom: spacing.md,
		padding: spacing.md,
		borderRadius: radius.card,
		backgroundColor: colors.surface,
	},
	voiceHeaderTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	voiceHeaderTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
	voiceChipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});

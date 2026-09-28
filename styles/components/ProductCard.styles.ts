import { StyleSheet } from "react-native";

import { PRODUCT_GRID_ITEM_WIDTH as ITEM_WIDTH } from "@/constants/layout";
import { colors, radius, shadow, spacing } from "@/constants/theme";

// Shared product-card look used by every listing in the app (home grid, hot
// sale carousel, shop, search, category pages).
//   surface card (12px radius, soft shadow) -> image on a soft-grey backdrop
//   -> name -> weight -> dominant price (+ muted USD, struck-through old price)
//   -> savings -> amber add-to-cart / stepper.
export const styles = StyleSheet.create({
	card: {
		width: ITEM_WIDTH,
		backgroundColor: colors.background,
		borderRadius: radius.card,
		padding: spacing.sm,
		...shadow.card,
	},
	imageWrapper: {
		position: "relative",
		width: "100%",
		aspectRatio: 1,
		marginBottom: spacing.sm,
		backgroundColor: colors.surfaceAlt,
		borderRadius: radius.card,
		padding: spacing.sm,
		justifyContent: "center",
		alignItems: "center",
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	imageOutOfStock: { opacity: 0.5 },

	// Out of stock: a full-text pill (never truncated) over the dimmed image.
	outOfStockBadge: {
		position: "absolute",
		left: spacing.sm,
		right: spacing.sm,
		bottom: spacing.sm,
		alignSelf: "flex-start",
		flexShrink: 0,
		paddingHorizontal: spacing.sm,
		paddingVertical: 4,
		borderRadius: radius.badge,
		backgroundColor: colors.text,
		alignItems: "center",
	},
	outOfStockText: {
		color: colors.textOnDark,
		fontWeight: "700",
		fontSize: 11,
		flexShrink: 0,
	},
	discountBadge: {
		position: "absolute",
		top: spacing.sm,
		left: spacing.sm,
		backgroundColor: colors.danger,
		paddingHorizontal: 6,
		paddingVertical: 3,
		borderRadius: radius.badge,
	},
	discountText: { color: colors.textOnDark, fontSize: 10, fontWeight: "700" },

	// Image + text block. It flexes so the add button sits at the bottom of every
	// card in a (stretched) grid row, without reserving blank lines under a
	// short title — the name, weight and price stay tightly stacked.
	body: { flex: 1 },
	name: {
		fontSize: 13,
		fontWeight: "500",
		lineHeight: 17,
		color: colors.text,
	},
	weight: { fontSize: 12, lineHeight: 15, color: colors.textMuted, marginTop: 1 },

	// Dominant selling price.
	price: { fontSize: 16, lineHeight: 20, fontWeight: "700", color: colors.text, marginTop: 3 },
	priceUsd: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
	// Pre-discount price: muted grey, struck through (the child needs its own
	// line-through — RN does not inherit it reliably on Android).
	oldPrice: {
		fontSize: 13,
		lineHeight: 16,
		fontWeight: "400",
		color: colors.textDisabled,
		textDecorationLine: "line-through",
		marginTop: 1,
	},
	oldPriceUsd: {
		fontSize: 11,
		color: colors.textDisabled,
		textDecorationLine: "line-through",
	},
	savings: { fontSize: 12, lineHeight: 15, fontWeight: "600", color: colors.success, marginTop: 1 },

	// Add to cart: full card width; amber with charcoal text.
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.xs,
		height: 36,
		backgroundColor: colors.primary,
		borderRadius: radius.badge,
		marginTop: spacing.sm,
	},
	addBtnText: { fontSize: 13, fontWeight: "700", color: colors.primaryText },

	// Same footprint as the add button once the item is in the cart.
	qtyRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		height: 36,
		marginTop: spacing.sm,
		backgroundColor: colors.primarySoft,
		borderRadius: radius.badge,
		paddingHorizontal: 2,
	},
	qtyBtn: {
		width: 32,
		height: 32,
		borderRadius: radius.badge - 2,
		backgroundColor: colors.primary,
		alignItems: "center",
		justifyContent: "center",
	},
	qtyBtnDisabled: { opacity: 0.35 },
	qtyValue: { fontSize: 14, fontWeight: "700", color: colors.text },
});

// Compact overrides for narrow cards (3-per-row grid, see
// PRODUCT_CARD_COMPACT_MAX_WIDTH). Layered on top of `styles`: same hierarchy,
// tighter padding and smaller type, and the USD price drops to its own line so
// the LBP price keeps its full width.
export const compactStyles = StyleSheet.create({
	card: { padding: 6 },
	imageWrapper: { padding: spacing.xs, marginBottom: 6 },
	discountBadge: { top: spacing.xs, left: spacing.xs, paddingHorizontal: 5, paddingVertical: 2 },
	discountText: { fontSize: 9 },
	outOfStockBadge: { left: spacing.xs, right: spacing.xs, bottom: spacing.xs, paddingHorizontal: spacing.xs },
	outOfStockText: { fontSize: 10 },
	name: { fontSize: 12, lineHeight: 15 },
	weight: { fontSize: 11, lineHeight: 14 },
	price: { fontSize: 13, lineHeight: 17, marginTop: 2 },
	priceUsd: { fontSize: 11, lineHeight: 14, fontWeight: "500", color: colors.textMuted },
	oldPrice: { fontSize: 11, lineHeight: 14 },
	savings: { fontSize: 11, lineHeight: 14 },
	addBtn: { height: 32, marginTop: 6, gap: 3 },
	addBtnText: { fontSize: 12 },
	qtyRow: { height: 32, marginTop: 6 },
	qtyBtn: { width: 28, height: 28 },
	qtyValue: { fontSize: 13 },
});

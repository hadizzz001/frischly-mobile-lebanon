// Design tokens — the single source of truth for colour, radius, spacing and
// elevation across the app. Every StyleSheet should read from here rather than
// hard-coding hex values, so the brand can be tuned in one place.
//
//   colors   — warm amber brand reserved for conversion points (Add to Cart,
//              Checkout, active filters); calm neutrals for surfaces/borders.
//   radius   — strict scale: 8 badges/pills, 12 cards, 24 sheets/search input.
//   spacing  — 8pt grid (multiples of 8; 4 only for icon/text hairline gaps).
//   shadow   — soft ambient elevation instead of hard borders.
import { Platform } from "react-native";

export const colors = {
	// Brand — amber (WCAG AA against charcoal text, never white text on it).
	primary: "#F59E0B",
	primaryDark: "#D97706",
	primaryPressed: "#B45309",
	primarySoft: "#FEF3C7", // tinted background for badges/active chips
	primaryText: "#111827", // text/spinner colour ON an amber surface

	// Text
	text: "#111827", // charcoal
	textSecondary: "#4B5563", // slate
	textMuted: "#6B7280", // labels
	textDisabled: "#9CA3AF",
	textOnDark: "#FFFFFF",
	link: "#B45309", // brand amber-brown, readable on white

	// Surfaces
	background: "#FFFFFF",
	surface: "#F9FAFB",
	surfaceAlt: "#F3F4F6", // image backdrops, neutral icon pills
	border: "#F3F4F6",
	borderStrong: "#E5E7EB",
	overlay: "rgba(17, 24, 39, 0.45)",

	// Semantic
	success: "#16A34A",
	successSoft: "#DCFCE7",
	danger: "#DC2626",
	dangerSoft: "#FEE2E2",
	warning: "#D97706",
	warningSoft: "#FEF3C7",
	info: "#2563EB",
} as const;

export const radius = {
	badge: 8, // action badges + pills
	card: 12, // product / category cards, inputs, buttons
	sheet: 24, // bottom sheets + search input
	full: 999,
} as const;

/** 8pt grid. `xs` is the only sub-8 step, for icon↔text gaps. */
export const spacing = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
	xxl: 48,
} as const;

/** Soft ambient elevation (iOS shadow + Android elevation). */
export const shadow = {
	card: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	raised: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.08,
		shadowRadius: 12,
		elevation: 4,
	},
	sheet: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: -4 },
		shadowOpacity: 0.08,
		shadowRadius: 16,
		elevation: 12,
	},
} as const;

export const typography = {
	title: { fontSize: 20, fontWeight: "700" as const, color: colors.text },
	heading: { fontSize: 18, fontWeight: "700" as const, color: colors.text },
	body: { fontSize: 14, fontWeight: "400" as const, color: colors.text },
	bodySecondary: { fontSize: 14, fontWeight: "400" as const, color: colors.textMuted },
	label: { fontSize: 12, fontWeight: "600" as const, color: colors.textMuted },
	caption: { fontSize: 12, fontWeight: "400" as const, color: colors.textMuted },
	price: { fontSize: 16, fontWeight: "700" as const, color: colors.text },
	priceOld: {
		fontSize: 13,
		fontWeight: "400" as const,
		color: colors.textDisabled,
		textDecorationLine: "line-through" as const,
	},
} as const;

/** Lucide icons everywhere: one library, one stroke weight. */
export const icon = {
	strokeWidth: 2,
	size: 20,
	sizeSmall: 16,
	sizeLarge: 24,
} as const;

/** Minimum comfortable touch target. */
export const hitSize = 44;

export const isIOS = Platform.OS === "ios";

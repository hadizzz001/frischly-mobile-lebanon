import { Text, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors } from "@/constants/theme";
import { styles } from "@/styles/components/ui/EmptyState.styles";
import type { EmptyStateProps } from "@/types/components/ui/EmptyState.types";

// Inline SVG illustrations (140x140) so empty screens never show a blank
// canvas. Soft-grey backdrop circle + amber accent, matching the tokens.
function Illustration({ kind }: { kind: "basket" | "pin" | "bell" | "search" }) {
	const stroke = colors.textSecondary;
	return (
		<Svg width={140} height={140} viewBox="0 0 140 140">
			<Circle cx={70} cy={70} r={64} fill={colors.surfaceAlt} />
			{kind === "basket" && (
				<>
					<Path
						d="M32 62h76l-8 40H40l-8-40z"
						fill={colors.background}
						stroke={stroke}
						strokeWidth={3}
						strokeLinejoin="round"
					/>
					<Path d="M50 62l14-24M90 62L76 38" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
					<Rect x={28} y={58} width={84} height={8} rx={4} fill={colors.primary} />
					<Path d="M58 74v18M70 74v18M82 74v18" stroke={colors.borderStrong} strokeWidth={3} strokeLinecap="round" />
				</>
			)}
			{kind === "pin" && (
				<>
					<Path
						d="M70 108s-30-26-30-50a30 30 0 0 1 60 0c0 24-30 50-30 50z"
						fill={colors.background}
						stroke={stroke}
						strokeWidth={3}
					/>
					<Circle cx={70} cy={58} r={11} fill={colors.primary} />
					<Path d="M44 112h52" stroke={colors.borderStrong} strokeWidth={4} strokeLinecap="round" />
				</>
			)}
			{kind === "bell" && (
				<>
					<Path
						d="M48 90V64a22 22 0 0 1 44 0v26l8 10H40l8-10z"
						fill={colors.background}
						stroke={stroke}
						strokeWidth={3}
						strokeLinejoin="round"
					/>
					<Path d="M62 104a8 8 0 0 0 16 0" stroke={stroke} strokeWidth={3} strokeLinecap="round" />
					<Circle cx={92} cy={46} r={9} fill={colors.primary} />
				</>
			)}
			{kind === "search" && (
				<>
					<Circle cx={64} cy={64} r={24} fill={colors.background} stroke={stroke} strokeWidth={3} />
					<Path d="M82 82l20 20" stroke={stroke} strokeWidth={4} strokeLinecap="round" />
					<Path d="M54 64h20" stroke={colors.primary} strokeWidth={4} strokeLinecap="round" />
				</>
			)}
		</Svg>
	);
}

/** Centered empty state: illustration, 18px title, 14px description, CTA.
 *  Give the parent `flexGrow: 1` (or use inside ListEmptyComponent) so it
 *  fills the viewport instead of floating near the top. */
export default function EmptyState({
	title,
	description,
	illustration = "basket",
	actionLabel,
	onAction,
	secondaryLabel,
	onSecondary,
	style,
}: EmptyStateProps) {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.illustration}>
				{typeof illustration === "string" ? (
					<Illustration kind={illustration as "basket" | "pin" | "bell" | "search"} />
				) : (
					illustration
				)}
			</View>
			<Text style={styles.title}>{title}</Text>
			{description ? <Text style={styles.description}>{description}</Text> : null}
			{actionLabel && onAction ? (
				<PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
			) : null}
			{secondaryLabel && onSecondary ? (
				<PrimaryButton
					label={secondaryLabel}
					onPress={onSecondary}
					variant="ghost"
					style={styles.secondary}
				/>
			) : null}
		</View>
	);
}

import { StyleSheet } from "react-native";

import { colors, spacing } from "@/constants/theme";

// One compact, centred group — illustration, title, description, CTA — in
// the middle of the available space. The CTA sizes to its label (with a
// comfortable minimum) and is centred: it used to stretch with a max width,
// which left it hugging the left edge once the cap applied.
export const styles = StyleSheet.create({
	container: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.lg,
	},
	illustration: { width: 140, height: 140, marginBottom: spacing.md },
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: colors.text,
		textAlign: "center",
	},
	description: {
		marginTop: spacing.xs,
		fontSize: 14,
		lineHeight: 20,
		color: colors.textMuted,
		textAlign: "center",
		maxWidth: 320,
	},
	action: { marginTop: spacing.md, alignSelf: "center", minWidth: 200, paddingHorizontal: spacing.xl },
	secondary: { marginTop: spacing.xs, alignSelf: "center" },
});

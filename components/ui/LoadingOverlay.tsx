import { ActivityIndicator, Modal, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { styles } from "@/styles/components/ui/LoadingOverlay.styles";
import type { LoadingOverlayProps } from "@/types/components/ui/LoadingOverlay.types";

// Full-screen "working…" scrim used for actions that take a moment but have
// no in-place spinner of their own — switching the app language, logging
// out, deleting the account. Rendered in a transparent Modal so it also
// covers bottom sheets and the header, and blocks double taps meanwhile.
//
// `inline` renders the same scrim as a plain view over its parent instead.
// iOS can't present a Modal while another one is still on screen or
// closing: the present is silently dropped, the later dismiss never
// reports back, and the Modal's invisible full-screen host stays mounted —
// the app keeps animating but every touch is swallowed. So a loader that
// opens in the same tap that closes another Modal must be inline.
export default function LoadingOverlay({ visible, label, inline = false }: LoadingOverlayProps) {
	const scrim = (
		<View
			style={[styles.scrim, inline && styles.inline]}
			accessibilityRole="progressbar"
			accessibilityLabel={label}
			accessibilityViewIsModal={inline}
		>
			<View style={styles.card}>
				<ActivityIndicator size="large" color={colors.primary} />
				{label ? <Text style={styles.label}>{label}</Text> : null}
			</View>
		</View>
	);

	if (inline) return visible ? scrim : null;

	return (
		<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
			{scrim}
		</Modal>
	);
}

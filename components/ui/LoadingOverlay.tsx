import { ActivityIndicator, Modal, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { styles } from "@/styles/components/ui/LoadingOverlay.styles";
import type { LoadingOverlayProps } from "@/types/components/ui/LoadingOverlay.types";

// Full-screen "working…" scrim used for actions that take a moment but have
// no in-place spinner of their own — switching the app language, logging
// out, deleting the account. Rendered in a transparent Modal so it also
// covers bottom sheets and the header, and blocks double taps meanwhile.
export default function LoadingOverlay({ visible, label }: LoadingOverlayProps) {
	return (
		<Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
			<View style={styles.scrim} accessibilityRole="progressbar" accessibilityLabel={label}>
				<View style={styles.card}>
					<ActivityIndicator size="large" color={colors.primary} />
					{label ? <Text style={styles.label}>{label}</Text> : null}
				</View>
			</View>
		</Modal>
	);
}

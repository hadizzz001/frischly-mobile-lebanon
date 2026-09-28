import { type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Footer from "@/components/Footer";
import BackButton from "@/components/ui/BackButton";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/PolicyScreen.styles";
import { rtlRow } from "@/utils/rtl";

// Frame for long-form text pages (privacy, terms). The content column grows
// to fill the viewport (flexGrow: 1) and the footer is anchored underneath
// with safe-area padding, so short pages never leave a blank gap above it.
export default function PolicyScreen({ title, children }: { title: string; children: ReactNode }) {
	const insets = useSafeAreaInsets();
	const { isRTL } = useTranslation();
	return (
		<ScrollView
			style={styles.screen}
			contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) }]}
		>
			<View style={styles.content}>
				<View style={[styles.topBar, rtlRow(isRTL)]}>
					<BackButton />
					<Text style={styles.title}>{title}</Text>
				</View>
				<View style={styles.body}>{children}</View>
			</View>
			<Footer />
		</ScrollView>
	);
}

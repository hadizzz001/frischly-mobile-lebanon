import { useTranslation } from "@/contexts/TranslationContext";
import { ScrollView, StyleSheet, Text } from "react-native";

const PrivacyPolicy = () => {
	const { t } = useTranslation();

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>{t("privacyTitle")}</Text>

			<Text style={styles.paragraph}>{t("privacyIntro")}</Text>

			<Text style={styles.subtitle}>1. {t("privacyCollectTitle")}</Text>
			<Text style={styles.paragraph}>{t("privacyCollect")}</Text>

			<Text style={styles.subtitle}>2. {t("privacyUseTitle")}</Text>
			<Text style={styles.paragraph}>{t("privacyUse")}</Text>

			<Text style={styles.subtitle}>3. {t("privacyShareTitle")}</Text>
			<Text style={styles.paragraph}>{t("privacyShare")}</Text>

			<Text style={styles.subtitle}>4. {t("privacySecurityTitle")}</Text>
			<Text style={styles.paragraph}>{t("privacySecurity")}</Text>

			<Text style={styles.subtitle}>5. {t("privacyChangesTitle")}</Text>
			<Text style={styles.paragraph}>{t("privacyChanges")}</Text>

			<Text style={styles.subtitle}>6. {t("privacyContactTitle")}</Text>
			<Text style={styles.paragraph}>
				{t("privacyContactEmail")}
				{"\n"}
				{t("privacyContactPhone")}
				{"\n\n"}
				{t("privacyContactCompany")}
				{"\n"}
				{t("privacyContactManager")}
				{"\n"}
				{t("privacyContactAddress")}
			</Text>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 20,
		backgroundColor: "#fff",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		marginBottom: 20,
	},
	subtitle: {
		fontSize: 20,
		fontWeight: "600",
		marginTop: 15,
		marginBottom: 5,
	},
	paragraph: {
		fontSize: 16,
		lineHeight: 22,
		color: "#333",
	},
});

export default PrivacyPolicy;

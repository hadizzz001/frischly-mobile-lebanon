import { useTranslation } from "@/contexts/TranslationContext";
import { ScrollView, StyleSheet, Text } from "react-native";

const TermsAndConditions = () => {
	const { t } = useTranslation();

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>{t("termsTitle")}</Text>

			<Text style={styles.paragraph}>{t("termsIntro")}</Text>

			<Text style={styles.subtitle}>1. {t("termsOrdersTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsOrders")}</Text>

			<Text style={styles.subtitle}>2. {t("termsPaymentsTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsPayments")}</Text>

			<Text style={styles.subtitle}>3. {t("termsShippingTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsShipping")}</Text>

			<Text style={styles.subtitle}>4. {t("termsReturnsTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsReturns")}</Text>

			<Text style={styles.subtitle}>5. {t("termsResponsibilitiesTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsResponsibilities")}</Text>

			<Text style={styles.subtitle}>6. {t("termsChangesTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsChanges")}</Text>

			<Text style={styles.subtitle}>7. {t("termsContactTitle")}</Text>
			<Text style={styles.paragraph}>{t("termsContact")}</Text>
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

export default TermsAndConditions;
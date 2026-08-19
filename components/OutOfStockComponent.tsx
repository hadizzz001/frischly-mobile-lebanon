import { useTranslation } from "@/contexts/TranslationContext";
import { Linking, Text, View } from "react-native";
import { styles } from "@/styles/components/OutOfStockComponent.styles";

interface OutOfStockComponentProps {
	itemName: string;
}

export default function OutOfStockComponent({
	itemName,
}: OutOfStockComponentProps) {
	const { t } = useTranslation();
	const whatsappNumber = "96181820902"; // Replace with your WhatsApp number (no +)
	const message = `I want to preorder this item ${itemName}`;
	const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
		message
	)}`;

	const handlePress = async () => {
		const supported = await Linking.canOpenURL(whatsappLink);
		if (supported) {
			await Linking.openURL(whatsappLink);
		} else {
			alert(t("whatsappNotInstalled"));
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.outOfStockText}>{t("out")}</Text>
			{/* <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>{t("preorder")}</Text>
      </TouchableOpacity> */}
		</View>
	);
}

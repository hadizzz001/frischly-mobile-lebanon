import { useTranslation } from "@/contexts/TranslationContext";
import { Linking, StyleSheet, Text, View } from "react-native";

interface OutOfStockComponentProps {
	itemName: string;
}

const OutOfStockComponent = ({ itemName }: OutOfStockComponentProps) => {
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
};

const styles = StyleSheet.create({
	container: {
		marginTop: 40,
		alignItems: "center",
	},
	outOfStockText: {
		color: "#222",
		fontSize: 24,
		marginBottom: 20,
	},
	button: {
		backgroundColor: "#1e90ff",
		paddingVertical: 10,
		paddingHorizontal: 30,
		borderRadius: 8,
	},
	buttonText: {
		color: "white",
		fontSize: 18,
		textAlign: "center",
	},
});

export default OutOfStockComponent;

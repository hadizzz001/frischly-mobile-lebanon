import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
	Alert,
	Image,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";


import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/Cart.styles";

export default function Cart() {
	const { t, td } = useTranslation();

	const { cart, removeFromCart, subtotal, addToCart, calculatePriceDetails, clearCart } =
		useCart();

	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [showModal, setShowModal] = useState(false);
	const [modalResponse, setModalResponse] = useState<string | null>(null);

	const handleModalResponse = (response: string) => {
		setShowModal(false);
		setModalResponse(response);

		if (response === "yes") {
			router.push("/checkout");
		}
	};

	const router = useRouter();

	const handleRemoveFromCart = (itemId: string) => {
		removeFromCart(itemId);
	};

	const handleClearCart = () => {
		Alert.alert(t("clearCartTitle"), t("clearCartConfirm"), [
			{ text: t("cancel"), style: "cancel" },
			{
				text: t("clearCart"),
				style: "destructive",
				onPress: () => clearCart(),
			},
		]);
	};

	const goToCart = () => {

		const has18PlusItem = cart.some((item) => item?.is18Plus === true);

		console.log("18 == ", has18PlusItem);

		if (has18PlusItem) {
			setShowModal(true); // show modal on parent
			return; // STOP here for now
		}
		router.push("/checkout");


	};


	return (
		<View style={styles.container}>
			<Text style={styles.heading}>{t("yourShoppingBag")}</Text>

			<ScrollView style={styles.cartList}>
				{cart && cart.length > 0 ? (
					cart.map((obj, index) => {
						const quantity = obj.quantity || 1;
						const priceDetails = calculatePriceDetails(obj, quantity);

						return (
							<View key={`${obj._id}-${index}`} style={styles.cartItem}>
								<Image source={{ uri: obj.picture }} style={styles.itemImage} />

								<View style={styles.details}>
									<Text style={styles.itemTitle}>{td(obj.name)}</Text>

									<View style={styles.quantityRow}>
										<Text style={styles.label}>
											{t("quantity")} {String(quantity)}
										</Text>
									</View>

									<Text style={styles.price}>
										${priceDetails.finalPrice.toFixed(2)}
									</Text>
								</View>

								<TouchableOpacity
									style={styles.removeBtn}
									onPress={() => handleRemoveFromCart(obj._id)}
								>
									<Ionicons name="trash" size={20} color="red" />
								</TouchableOpacity>
							</View>
						);
					})
				) : (
					<Text style={styles.emptyText}>{t("noItemsInBag")}</Text>
				)}
			</ScrollView>

			<View style={styles.footer}>
				<Text style={styles.total}>
					{t("total")}: ${subtotal.toFixed(2)}{" "}
				</Text>

				<TouchableOpacity style={styles.checkoutBtn} onPress={goToCart}>
					<Text style={styles.checkoutText}>{t("goToCheckout")}</Text>
				</TouchableOpacity>

				{cart && cart.length > 0 ? (
					<TouchableOpacity
						style={styles.clearCartLink}
						onPress={handleClearCart}
					>
						<Text style={styles.clearCartText}>{t("clearCart")}</Text>
					</TouchableOpacity>
				) : null}
			</View>


			<Modal visible={showModal} transparent animationType="slide">
				<View style={styles.modalBackground}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>
							{t("ageVerificationTitle")}
						</Text>

						<Text style={styles.modalMessage}>
							{t("ageVerification")}
						</Text>

						<View style={styles.modalButtons}>
							{/* YES */}
							<TouchableOpacity
								onPress={() => handleModalResponse("yes")}
								style={styles.yesButton}
							>
								<Text style={styles.yesButtonText}>
									{t("yes")}
								</Text>
							</TouchableOpacity>

							{/* NO */}
							<TouchableOpacity
								onPress={() => handleModalResponse("no")}
								style={styles.noButton}
							>
								<Text style={styles.noButtonText}>
									{t("no")}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

		</View>
	);
}

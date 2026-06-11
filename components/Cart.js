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
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";


import { useTranslation } from "@/contexts/TranslationContext";

const Cart = () => {
	const { t, td } = useTranslation();

	const { cart, removeFromCart, subtotal, addToCart, calculatePriceDetails, clearCart } =
		useCart();

	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [showModal, setShowModal] = useState(false);
	const [modalResponse, setModalResponse] = useState(null);

	const handleModalResponse = (response) => {
		setShowModal(false);
		setModalResponse(response);

		if (response === "yes") {
			router.push("/checkout");
		}
	};

	const router = useRouter();

	const handleRemoveFromCart = (itemId) => {
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
						<Text
							style={{
								marginBottom: 20,
								textAlign: "center",
								fontWeight: "bold",
							}}
						>
							{t("ageVerificationTitle")}
						</Text>

						<Text style={{ marginBottom: 30, textAlign: "center" }}>
							{t("ageVerification")}
						</Text>

						<View style={{ width: "100%" }}>
							{/* YES */}
							<TouchableOpacity
								onPress={() => handleModalResponse("yes")}
								style={{
									backgroundColor: "#f4bb26",
									paddingVertical: 16,
									borderRadius: 8,
									marginBottom: 15,
									width: "100%",
								}}
							>
								<Text
									style={{
										color: "black",
										textAlign: "center",
										fontWeight: "bold",
										fontSize: 18,
									}}
								>
									{t("yes")}
								</Text>
							</TouchableOpacity>

							{/* NO */}
							<TouchableOpacity
								onPress={() => handleModalResponse("no")}
								style={{
									paddingVertical: 16,
									borderRadius: 8,
									width: "100%",
								}}
							>
								<Text
									style={{
										color: "#f4bb26",
										textAlign: "center",
										fontWeight: "bold",
										fontSize: 18,
									}}
								>
									{t("no")}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

		</View>
	);
};

export default Cart;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#FFFFFF",
	},
	heading: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 12,
		textAlign: "center", // center the heading
	},
	cartList: {
		flex: 1,
		marginBottom: 10,
	},
	cartItem: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#000000",
		borderRadius: 8,
		padding: 10,
		position: "relative",
		overflow: "visible", // <-- make sure remove button is visible
	},

	removeBtn: {
		position: "absolute",
		top: 50, // slightly above the item container
		right: 50, // slightly outside the right edge
		width: 40,
		height: 40,
		backgroundColor: "transparent",
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 99999999, // <-- very high to be on top
	},

	itemImage: {
		width: 80,
		height: 80,
		marginRight: 10,
		borderRadius: 6,
	},
	details: {
		flex: 1,
	},
	itemTitle: {
		marginBottom: 4,
		fontSize: 16,
	},
	itemCategory: {
		fontSize: 12,
		color: "#000000",
		marginBottom: 4,
	},
	quantityRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},
	label: {
		marginRight: 5,
	},
	qtyInput: {
		borderWidth: 1,
		borderColor: "#000000",
		width: 50,
		height: 50,
		textAlign: "center",
		borderRadius: 6,
	},
	price: {
		marginTop: 6,
		fontWeight: "bold",
		color: "#000000",
	},

	emptyText: {
		textAlign: "center",
		marginTop: 40,
		color: "#000000",
	},
	footer: {
		paddingVertical: 12,
		borderTopWidth: 1,
		borderColor: "#000000",
		marginBottom: 20,
	},
	total: {
		fontSize: 18,
		fontWeight: "bold",
		marginBottom: 12,
	},
	checkoutBtn: {
		backgroundColor: "#f4bb26",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	checkoutText: {
		color: "#000000",
		fontWeight: "bold",
	},
	clearCartLink: {
		alignItems: "center",
		paddingVertical: 12,
		marginTop: 4,
	},
	clearCartText: {
		color: "red",
		fontWeight: "600",
		textDecorationLine: "underline",
	},
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		width: "80%",
	},

});

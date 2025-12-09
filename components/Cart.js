import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { useTranslation } from "@/contexts/TranslationContext";

const Cart = () => {
	const { t } = useTranslation();

	const { cart, removeFromCart, subtotal, addToCart, calculatePriceDetails } =
		useCart();

	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const router = useRouter();

	const handleRemoveFromCart = (itemId) => {
		removeFromCart(itemId);
	};

	const goToCart = () => router.push("/checkout");

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
									<Text style={styles.itemTitle}>{obj.name}</Text>

									<View style={styles.quantityRow}>
										<Text style={styles.label}>
											{t("quantity")} {String(quantity)}
										</Text>
									</View>

									<Text style={styles.price}>
										€{priceDetails.finalPrice.toFixed(2)}
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
					{t("total")}: €{subtotal.toFixed(2)}{" "}
				</Text>

				<TouchableOpacity style={styles.checkoutBtn} onPress={goToCart}>
					<Text style={styles.checkoutText}>{t("goToCheckout")}</Text>
				</TouchableOpacity>
			</View>
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
		backgroundColor: "#FFC300",
		padding: 12,
		borderRadius: 8,
		alignItems: "center",
	},
	checkoutText: {
		color: "#000000",
		fontWeight: "bold",
	},
});

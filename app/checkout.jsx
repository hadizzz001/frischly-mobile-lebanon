import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrderComponent from "../components/CreateOrderButton";

const CheckoutScreen = () => {
	const { t } = useTranslation();
	const [showModal, setShowModal] = useState(false);
	const [modalResponse, setModalResponse] = useState(null);
	const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "cash"
	const [promoCode, setPromoCode] = useState("");
	const [appliedPromo, setAppliedPromo] = useState(null); // { promoCode: {...}, discountAmount: number }
	const [discountAmount, setDiscountAmount] = useState(0);
	const [promoLoading, setPromoLoading] = useState(false);

	const { cart, removeFromCart, subtotal, calculatePriceDetails } = useCart();
	const [deliveryFee] = useState(0);
	const [total, setTotal] = useState("0.00");

	const [deliveryTime, setDeliveryTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [pickerMode, setPickerMode] = useState("date"); // "date" | "time"

	const router = useRouter();
	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	// ✅ Unified state
	const [state, setState] = useState({
		loading: true,
		user: null,
		token: null,
		inputs: {
			name: "",
			email: "",
			phone: "",
			country: "LB",
			state: "",
			city: "",
			street: "",
		},
		country: "LB",
	});

	// Check login and fetch user
	useEffect(() => {
		const checkLogin = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				// ✅ If guest → go to start
				if (guest !== "false") {
					console.log("g = ", guest);
					console.log("🟡 Guest detected → redirecting to /start");
					router.replace("/start");
					return;
				}

				// ❌ No user and not guest → go to start
				if (!userData) {
					console.log("🔴 No user found → redirecting to /start");
					router.replace("/start");
					return;
				}

				// 🟢 Logged user flow
				const parsedUser = JSON.parse(userData);
				const token = parsedUser?.token;

				if (!token) {
					console.log("⚠️ Missing token → redirecting to /start");
					router.replace("/start");
					return;
				}

				const res = await fetch(
					"https://frischly-dash-leb.onrender.com/api/auth/me",
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);

				if (!res.ok) {
					console.log("⚠️ Failed /me request → redirecting to /start");
					router.replace("/start");
					return;
				}

				const data = await res.json();
				const user = data.data.user;

				setState((prev) => ({
					...prev,
					user,
					token: token,
					inputs: {
						name: user.name || "",
						email: user.email || "",
						phone: user.phoneNumber || "",
						country: "LB",
						state: user.address?.state || "",
						city: user.address?.city || "",
						street: user.address?.street || "",
					},
					country: "LB",
					loading: false,
				}));
			} catch (err) {
				console.error("🔥 Error checking login:", err);
				router.replace("/start");
			}
		};

		checkLogin();
	}, [router]);

	const calculateTotal = () => {
		const s = Number(subtotal);
		const d = Number(deliveryFee);
		const disc = Number(discountAmount);

		// Calculate fee on (subtotal + delivery)
		const processFee = (s + d) * 0.029 + 0.3;

		// Round to 2 decimals
		// const fees = Math.round(processFee * 100) / 100;
		const fees = 0;

		// Final total (subtract discount)
		const totalAmount = s + d + fees - disc;

		return Math.max(totalAmount, 0).toFixed(2); // Ensure total doesn't go negative
	};

	useEffect(() => {
		setTotal(calculateTotal());
	}, [subtotal, deliveryFee, discountAmount]);

	const validatePromoCode = async () => {
		if (!promoCode.trim()) {
			Alert.alert("Error", "Please enter a promo code");
			return;
		}

		setPromoLoading(true);
		try {
			const orderTotal = Number(subtotal) + Number(deliveryFee);
			const response = await fetch(
				"https://frischly-dash-leb.onrender.com/api/promocodes/validate",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${state.token}`,
					},
					body: JSON.stringify({
						code: promoCode.toUpperCase(),
						orderTotal: orderTotal,
					}),
				},
			);

			const data = await response.json();

			if (data.success) {
				setAppliedPromo(data.data);
				setDiscountAmount(data.data.discountAmount);
				Alert.alert(
					"Success",
					`Promo code applied! Discount: €${data.data.discountAmount.toFixed(2)}`,
				);
			} else {
				setPromoCode("");
				Alert.alert("Error", data.message || "Invalid promo code");
			}
		} catch (error) {
			console.error("Error validating promo code:", error);
			setPromoCode("");
			Alert.alert("Error", "Failed to validate promo code. Please try again.");
		} finally {
			setPromoLoading(false);
		}
	};

	const handleInput = (name, value) => {
		setState((prev) => ({
			...prev,
			inputs: { ...prev.inputs, [name]: value },
		}));
	};

	const handleModalResponse = (response) => {
		setShowModal(false);
		setModalResponse(response); // trigger child effect
	};

	const handleRemoveFromCart = (id) => removeFromCart(id);

	useEffect(() => {
		console.log("🚚 Delivery Time:", deliveryTime);
		console.log("📅 ISO:", deliveryTime.toISOString());
		console.log("⏰ Local:", deliveryTime.toString());
	}, [deliveryTime]);

	if (state.loading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>{t("loadingUserInfo")}</Text>
			</View>
		);
	}

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	if (!cart || cart.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>{t("noItemsInBag")}</Text>
				<TouchableOpacity
					style={styles.button}
					onPress={() => router.push("/shop")}
				>
					<Text style={styles.buttonText}>{t("continueShopping")}</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			<ScrollView
				style={styles.container}
				contentContainerStyle={{ paddingBottom: 150 }}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="chevron-left" size={24} color="#000000" />
				</TouchableOpacity>

				<Text style={styles.heading}>{t("shippingInformation")}</Text>

				<TextInput
					style={styles.input}
					placeholder={t("emailOptional")}
					value={state.inputs.email}
					//onChangeText={(v) => handleInput("email", v)}
					keyboardType="email-address"
					editable={false}
				/>

				<TextInput
					style={styles.input}
					placeholder={t("fullNameRequired")}
					value={state.inputs.name}
					onChangeText={(v) => handleInput("name", v)}
				/>

				<View style={{ marginBottom: 12 }}>
					<TouchableOpacity
						onPress={() => Alert.alert(t("errorTitle"), t("countryFixed"))}
					>
						<View pointerEvents="none">
							<TextInput
								style={styles.input}
								value={t("lebanon")}
								editable={false}
							/>
						</View>
					</TouchableOpacity>
				</View>

				<TextInput
					style={styles.input}
					placeholder={t("cityRequired")}
					value={state.inputs.city}
					onChangeText={(v) => handleInput("city", v)}
				/>

				<TextInput
					style={styles.input}
					placeholder={t("stateRequired")}
					value={state.inputs.state}
					onChangeText={(v) => handleInput("state", v)}
				/>

				<View style={styles.row}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder={t("phoneRequired")}
						value={state.inputs.phone}
						keyboardType="phone-pad"
						onChangeText={(v) => handleInput("phone", v)}
					/>
				</View>

				<TextInput
					style={styles.input}
					placeholder={t("streetRequired")}
					value={state.inputs.street}
					onChangeText={(v) => handleInput("street", v)}
				/>

				<Text style={styles.heading}>{t("dtime")}</Text>

				<TouchableOpacity
					onPress={() => setShowDatePicker(true)}
					style={styles.input}
				>
					<Text>
						{deliveryTime.toLocaleString("en-US", {
							year: "numeric",
							month: "2-digit",
							day: "2-digit",
							hour: "numeric",
							minute: "2-digit",
							second: "2-digit",
							hour12: true,
						})}
					</Text>

					{showDatePicker && (
						<DateTimePicker
							value={deliveryTime}
							mode={Platform.OS === "android" ? pickerMode : "datetime"}
							display={Platform.OS === "android" ? "spinner" : "default"}
							minimumDate={new Date()}
							onChange={(event, selectedDate) => {
								if (event.type !== "set") {
									setShowDatePicker(false);
									setPickerMode("date");
									return;
								}

								if (Platform.OS === "android") {
									if (pickerMode === "date") {
										// user picked date → now pick time
										const newDate = selectedDate || deliveryTime;
										setDeliveryTime(newDate);
										setPickerMode("time");
									} else {
										// user picked time → done
										const newDate = selectedDate || deliveryTime;
										setDeliveryTime(newDate);
										setShowDatePicker(false);
										setPickerMode("date");
									}
								} else {
									// iOS
									setDeliveryTime(selectedDate);
									setShowDatePicker(false);
								}
							}}
						/>
					)}
				</TouchableOpacity>
				<Text style={styles.heading}>{t("paymentMethod")}</Text>

				<View style={styles.paymentOptions}>
					<TouchableOpacity
						style={[
							styles.paymentOption,
							paymentMethod === "card" && styles.paymentOptionSelected,
						]}
						onPress={() => setPaymentMethod("card")}
					>
						<Feather
							name="credit-card"
							size={24}
							color={paymentMethod === "card" ? "#000" : "#666"}
						/>
						<Text
							style={[
								styles.paymentOptionText,
								paymentMethod === "card" && styles.paymentOptionTextSelected,
							]}
						>
							{t("onlinePayment")}
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.paymentOption,
							paymentMethod === "cash" && styles.paymentOptionSelected,
						]}
						onPress={() => setPaymentMethod("cash")}
					>
						<Feather
							name="dollar-sign"
							size={24}
							color={paymentMethod === "cash" ? "#000" : "#666"}
						/>
						<Text
							style={[
								styles.paymentOptionText,
								paymentMethod === "cash" && styles.paymentOptionTextSelected,
							]}
						>
							{t("cashOnDelivery")}
						</Text>
					</TouchableOpacity>
				</View>

				<Text style={styles.heading}>{t("promoCode")}</Text>
				<View style={styles.promoCodeContainer}>
					<TextInput
						style={[styles.input, { flex: 1, marginRight: 10 }]}
						placeholder={t("enterPromoCode")}
						value={promoCode}
						onChangeText={(text) => {
							setPromoCode(text);
							// Clear applied promo when user starts typing a new code
							if (appliedPromo && text !== appliedPromo.promoCode.code) {
								setAppliedPromo(null);
								setDiscountAmount(0);
							}
						}}
						autoCapitalize="characters"
					/>
					<TouchableOpacity
						style={[
							styles.applyButton,
							promoLoading && styles.applyButtonDisabled,
						]}
						onPress={validatePromoCode}
						disabled={promoLoading}
					>
						{promoLoading ? (
							<ActivityIndicator size="small" color="#fff" />
						) : (
							<Text style={styles.applyButtonText}>{t("apply")}</Text>
						)}
					</TouchableOpacity>
				</View>

				<Text style={styles.heading}>{t("orderSummary")}</Text>

				<View>
					{cart.map((item, index) => {
						const quantity = item.quantity || 1;
						const priceDetails = calculatePriceDetails(item, quantity);

						return (
							<View key={`${item._id}-${index}`} style={styles.cartItem}>
								<Image
									source={{ uri: item.picture.replace("/upload/", "/upload/") }}
									style={styles.cartImage}
									resizeMode="contain"
								/>
								<View style={{ flex: 1 }}>
									<Text>{item.title}</Text>
									<Text>
										{t("quantity")} {quantity}
									</Text>
									<Text style={styles.price}>
										€{priceDetails.finalPrice.toFixed(2)}
									</Text>
								</View>
								<TouchableOpacity
									onPress={() => handleRemoveFromCart(item._id)}
								>
									<Ionicons name="trash" size={20} color="red" />
								</TouchableOpacity>
							</View>
						);
					})}
				</View>

				<View style={styles.summaryRow}>
					<Text>{t("subtotal")}</Text>
					<Text>€{subtotal.toFixed(2)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text>{t("delivery")}</Text>
					<Text>€{deliveryFee.toFixed(2)}</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text>{t("processFees")}</Text>
					<Text> 0</Text>
				</View>
				{discountAmount > 0 && (
					<View style={styles.summaryRow}>
						<Text>{t("discount")}</Text>
						<Text>-€{discountAmount.toFixed(2)}</Text>
					</View>
				)}
				<View style={styles.summaryRow}>
					<Text style={{ fontWeight: "bold" }}>{t("total")}</Text>
					<Text style={{ fontWeight: "bold" }}>€{total}</Text>
				</View>

				<OrderComponent
					items={cart}
					customer={state.user}
					setShowModal={setShowModal}
					modalResponse={modalResponse}
					paymentMethod={paymentMethod}
					deliveryTime={deliveryTime.toISOString()}
					appliedPromo={appliedPromo}
					discountAmount={discountAmount}
				/>
			</ScrollView>
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

						{/* Buttons container */}
						<View style={{ width: "100%" }}>
							{/* YES BUTTON */}
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

							{/* NO BUTTON */}
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
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: "#FFFFFF",
		paddingTop: 50,
	},
	heading: { fontSize: 20, fontWeight: "bold", marginVertical: 12 },
	input: {
		borderWidth: 1,
		borderColor: "#000000",
		borderRadius: 6,
		padding: 10,
		marginVertical: 6,
	},
	row: { flexDirection: "row", alignItems: "center" },
	cartItem: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 8,
		borderBottomWidth: 1,
		borderColor: "#000000",
		paddingBottom: 8,
	},
	cartImage: { width: 60, height: 60, marginRight: 12, borderRadius: 6 },
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginVertical: 4,
	},
	button: {
		backgroundColor: "#f4bb26",
		padding: 12,
		borderRadius: 6,
		alignItems: "center",
	},
	buttonText: { color: "#FFFFFF", fontWeight: "bold" },
	emptyContainer: {
		backgroundColor: "#fff",
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		marginTop: 60,
	},
	emptyText: { fontSize: 18, marginBottom: 20 },
	paymentOptions: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 16,
	},
	paymentOption: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		marginHorizontal: 4,
	},
	paymentOptionSelected: {
		borderColor: "#f4bb26",
		backgroundColor: "#f4bb2620",
	},
	paymentOptionText: {
		marginLeft: 8,
		fontSize: 14,
		color: "#666",
	},
	paymentOptionTextSelected: {
		color: "#000",
		fontWeight: "bold",
	},
	promoCodeContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},
	applyButton: {
		backgroundColor: "#f4bb26",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 6,
		justifyContent: "center",
		alignItems: "center",
	},
	applyButtonDisabled: {
		backgroundColor: "#ccc",
	},
	applyButtonText: {
		color: "#000",
		fontWeight: "bold",
		fontSize: 14,
	},
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
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

export default CheckoutScreen;

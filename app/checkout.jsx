import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	Image,
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

	const { cart, removeFromCart, subtotal, calculatePriceDetails } = useCart();
	const [deliveryFee, setDeliveryFee] = useState(0);
	const [total, setTotal] = useState("0.00");

	const [zones, setZones] = useState([]);

	const [country, setCountry] = useState("");
	const [cities, setCities] = useState([]);
	const [countryData, setCountryData] = useState({
		code: "",
		flag: "",
		dial: "",
	});

	const router = useRouter();
	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	// ✅ Unified state
	const [state, setState] = useState({
		loading: true,
		user: null,
		inputs: {
			name: "",
			email: "",
			phone: "",
			country: "",
			state: "",
			city: "",
			zipCode: "",
			street: "",
		},
		country: "",
	});

	useEffect(() => {
		const fetchZones = async () => {
			try {
				const res = await axios.get(
					"https://frischlyshop-server.onrender.com/api/zones?isActive=true"
				);
				if (res.data.success) {
					setZones(res.data.data); // store array of zones
				}
			} catch (error) {
				console.log("Error fetching zones:", error.message);
			}
		};
		fetchZones();
	}, []);

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
					"https://frischlyshop-server.onrender.com/api/auth/me",
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
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
					inputs: {
						name: user.name || "",
						email: user.email || "",
						phone: user.phoneNumber || "",
						country: user.address?.country || "",
						state: user.address?.state || "",
						city: user.address?.city || "",
						zipCode: user.address?.zipCode || "",
						street: user.address?.street || "",
					},
					country: user.address?.country || "",
					loading: false,
				}));
			} catch (err) {
				console.error("🔥 Error checking login:", err);
				router.replace("/start");
			}
		};

		checkLogin();
	}, [router]);

	// Delivery fee fetch
	useEffect(() => {
		const fetchPrice = async () => {
			if (!state.inputs.zipCode || state.inputs.zipCode.length < 4) {
				setDeliveryFee(0);
				return;
			}
			try {
				const response = await fetch(
					"https://frischlyshop-server.onrender.com/api/zones/calculate-delivery",
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ zipCode: state.inputs.zipCode }),
					}
				);
				const data = await response.json();
				if (data.success) {
					setDeliveryFee(data.data.deliveryFee);
				} else {
					setDeliveryFee(0);
				}
			} catch (error) {
				console.error("Delivery fetch error:", error);
				setDeliveryFee(0);
			}
		};
		fetchPrice();
	}, [state.inputs.zipCode]);

	const calculateTotal = () => {
		const s = Number(subtotal);
		const d = Number(deliveryFee);

		// Calculate fee on (subtotal + delivery)
		const processFee = (s + d) * 0.029 + 0.3;

		// Round to 2 decimals
		// const fees = Math.round(processFee * 100) / 100;
		const fees = 0;

		// Final total
		const totalAmount = s + d + fees;

		return totalAmount.toFixed(2);
	};

	useEffect(() => {
		setTotal(calculateTotal());
	}, [subtotal, deliveryFee]);

	const handleInput = (name, value) => {
		setState((prev) => ({
			...prev,
			inputs: { ...prev.inputs, [name]: value },
		}));
	};

	const handleRemoveFromCart = (id) => removeFromCart(id);

	if (state.loading) {
		return (
			<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
				<Text>Loading user info...</Text>
			</View>
		);
	}

	const inputBg = "#FFFFFF";
	const inputText = "#000000";
	const placeholderColor = "#666666";

	if (!cart || cart.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<Text style={styles.emptyText}>
					You have no items in your shopping bag.
				</Text>
				<TouchableOpacity
					style={styles.button}
					onPress={() => router.push("/shop")}
				>
					<Text style={styles.buttonText}>Continue shopping</Text>
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

				<Text style={styles.heading}>Shipping Information</Text>

				<TextInput
					style={styles.input}
					placeholder="Email (optional)"
					value={state.inputs.email}
					//onChangeText={(v) => handleInput("email", v)}
					keyboardType="email-address"
					editable={false}
				/>

				<TextInput
					style={styles.input}
					placeholder="Full Name *"
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
								value={t("germany")}
								editable={false}
							/>
						</View>
					</TouchableOpacity>
				</View>

				<TextInput
					style={styles.input}
					placeholder="City *"
					value={state.inputs.city}
					onChangeText={(v) => handleInput("city", v)}
				/>

				<TextInput
					style={styles.input}
					placeholder="State / Region *"
					value={state.inputs.state}
					onChangeText={(v) => handleInput("state", v)}
				/>

				<View
					style={{
						marginBottom: 12,
						width: "100%",
						minHeight: 55,
						borderWidth: 1,
						borderColor: "#000000",
						borderRadius: 12,
						backgroundColor: "#FFFFFF",
						justifyContent: "center",
					}}
				>
					<Picker
						selectedValue={state.inputs.zipCode}
						onValueChange={(itemValue) => handleInput("zipCode", itemValue)}
						style={{ color: "#000" }}
					>
						<Picker.Item label="Select Zip Code" value="" />
						{zones.map((zone) => (
							<Picker.Item
								key={zone._id}
								label={`${zone.zipCode} `} // display both
								value={zone.zipCode} // only store zipCode
							/>
						))}
					</Picker>
				</View>

				<View style={styles.row}>
					<TextInput
						style={[styles.input, { flex: 1 }]}
						placeholder="Phone *"
						value={state.inputs.phone}
						keyboardType="phone-pad"
						onChangeText={(v) => handleInput("phone", v)}
					/>
				</View>

				<TextInput
					style={styles.input}
					placeholder="Street *"
					value={state.inputs.street}
					onChangeText={(v) => handleInput("street", v)}
				/>

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
									<Text>Qty: {quantity}</Text>
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
					<Text>{t("Process fees")}</Text>
					<Text> 0</Text>
				</View>
				<View style={styles.summaryRow}>
					<Text style={{ fontWeight: "bold" }}>{t("total")}</Text>
					<Text style={{ fontWeight: "bold" }}>€{total}</Text>
				</View>

				<OrderComponent items={cart} customer={state.user} />
			</ScrollView>
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
		backgroundColor: "#FFC300",
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
	safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
});

export default CheckoutScreen;

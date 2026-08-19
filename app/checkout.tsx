import CityPicker from "@/components/CityPicker";
import IOSDatePickerModal from "@/components/IOSDatePickerModal";
import { MAIN_SOURCE, useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { ApiError, AuthService, MarketService, PromoCodeService } from "@/services/api";
import type { User } from "@/types";
import { isValidLebanesePhone } from "@/utils/phone";
import { rtlRow, rtlText } from "@/utils/rtl";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import { styles } from "@/styles/app/checkout.styles";
import { collectMarketTokens } from "@/utils/market";
import {
	ActivityIndicator,
	Alert,
	Image,
	Modal,
	Platform,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrderComponent from "../components/CreateOrderButton";

interface AppliedPromo {
	promoCode: { id?: string; code?: string };
	discountAmount: number;
	[key: string]: unknown;
}

interface CheckoutInputs {
	name: string;
	email: string;
	phone: string;
	country: string;
	state: string;
	city: string;
	street: string;
}

interface CheckoutState {
	loading: boolean;
	user: User | null;
	token: string | null;
	inputs: CheckoutInputs;
	country: string;
}

export default function CheckoutScreen() {
	const { t, isRTL } = useTranslation();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [modalResponse, setModalResponse] = useState<string | null>(null);
	const [paymentMethod, setPaymentMethod] = useState<string>("card"); // "card" or "cash"
	const [promoCode, setPromoCode] = useState<string>("");
	const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null); // { promoCode: {...}, discountAmount: number }
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [promoLoading, setPromoLoading] = useState<boolean>(false);

	const { cart, removeFromCart, subtotal, calculatePriceDetails, cartSource, cartMarket } =
		useCart();
	const [deliveryFee] = useState<number>(0);
	const [total, setTotal] = useState<string>("0.00");
	const [marketDisplayName, setMarketDisplayName] = useState<string | null>(null);

	// Resolve the market name: cartMarket may be a populated object, a string ID,
	// or null (main store). The single-market endpoint requires auth, so we always
	// use the public list to look up by ID.
	useEffect(() => {
		if (!cartSource || cartSource === MAIN_SOURCE) {
			setMarketDisplayName("Frischly LB");
			return;
		}
		// Already a populated object with a name — use it directly.
		if (cartMarket && typeof cartMarket === "object") {
			const name = cartMarket.name || cartMarket.username;
			if (name) {
				setMarketDisplayName(name);
				return;
			}
		}
		// Only have the ID — look it up from the public markets list.
		const marketId = typeof cartMarket === "string" ? cartMarket : cartSource;
		MarketService.listPublic()
			.then((res) => {
				const list = Array.isArray(res?.data) ? res.data : [];
				const found = list.find((m) => String(m._id) === String(marketId));
				if (found?.name || (found as { username?: string })?.username) {
					setMarketDisplayName(found?.name || (found as { username?: string })?.username || null);
				}
			})
			.catch(() => {});
	}, [cartSource, cartMarket]);

	const [deliveryTime, setDeliveryTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [pickerMode, setPickerMode] = useState("date"); // "date" | "time"

	const router = useRouter();
	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	// ✅ Unified state
	const [state, setState] = useState<CheckoutState>({
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
		const checkLogin = async (): Promise<void> => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				// ✅ Guest browsing (explicitly opted in via "Continue as guest") →
				// go to start to log in before checking out. Logged-in accounts
				// never set "guest" to "true" (it's "false", or simply never set
				// for some login paths), so only the explicit "true" value means
				// guest — matches the check used everywhere else in the app
				// (CartContext, RepeatOrderButton, userCity, etc).
				if (guest === "true") {
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

				let user: User;
				try {
					const res = await AuthService.me();
					const fetchedUser = (res.data as unknown as { user?: User })?.user;
					if (!fetchedUser) {
						console.log("⚠️ Failed /me request → redirecting to /start");
						router.replace("/start");
						return;
					}
					user = fetchedUser;
				} catch {
					console.log("⚠️ Failed /me request → redirecting to /start");
					router.replace("/start");
					return;
				}

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

	const calculateTotal = (): string => {
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

	const validatePromoCode = async (): Promise<void> => {
		if (!promoCode.trim()) {
			Alert.alert(t("errorTitle"), t("enterPromoCodeFirst"));
			return;
		}

		setPromoLoading(true);

		// ----------------------- DEBUG: entered code + cart market -----------------
		const enteredCode = promoCode.toUpperCase();
		console.log("\n========== 🎟️  PROMO DEBUG START ==========");
		console.log("📝 Entered promo code:", enteredCode);
		console.log("🛒 cartSource (market _id or 'MAIN'):", cartSource);
		console.log(
			"🛒 cartMarket (object on cart items):",
			JSON.stringify(cartMarket, null, 2),
		);
		console.log(
			"🛒 Cart market match tokens:",
			[...collectMarketTokens(cartMarket || cartSource)],
		);
		console.log(
			"🛒 Cart items (id | name | market):",
			cart.map((it) => ({
				_id: it._id,
				name: it.name,
				market: it.market,
			})),
		);

		try {
			const orderTotal = Number(subtotal) + Number(deliveryFee);
			// The cart can only contain items from a single source (one market or
			// the main admin store). Tell the backend which market so it can find
			// that market's promo codes (they live in a separate collection).
			const marketId =
				cartSource && cartSource !== MAIN_SOURCE ? cartSource : null;

			console.log(
				"\n🚀 Validating code:",
				enteredCode,
				"orderTotal:",
				orderTotal,
				"market:",
				marketId,
			);

			const data = await PromoCodeService.validate({
				code: promoCode.toUpperCase(),
				orderTotal: orderTotal,
				market: marketId,
			});

			// ------------------- DEBUG: raw validate response ----------------------
			console.log(
				"📬 VALIDATE raw response body:\n",
				JSON.stringify(data, null, 2),
			);

			if (data.success) {
				// The cart can only hold items from one source: a single market, or
				// the main admin store. A promo code must belong to that same source.
				const dataData = data.data as Record<string, unknown> | null;
				const promo = ((dataData?.promoCode as Record<string, unknown>) ?? dataData ?? {}) as Record<string, unknown>;
				const promoMarketRaw =
					promo.market ??
					promo.marketId ??
					promo.market_id ??
					dataData?.market ??
					dataData?.marketId ??
					null;

				// Whether the response actually carries market info for the promo.
				const promoHasMarketInfo =
					"market" in promo ||
					"marketId" in promo ||
					"market_id" in promo ||
					(!!dataData &&
						("market" in dataData || "marketId" in dataData));

				const cartIsMarket = !!cartSource && cartSource !== MAIN_SOURCE;
				const cartTokens = collectMarketTokens(cartMarket || cartSource);
				const promoTokens = collectMarketTokens(promoMarketRaw);

				// ------------------- DEBUG: market comparison ----------------------
				console.log("\n🔎 MARKET MATCH CHECK:");
				console.log("   • Entered code:", enteredCode);
				console.log("   • promo object keys:", Object.keys(promo));
				console.log("   • promo market (raw):", JSON.stringify(promoMarketRaw));
				console.log("   • promoHasMarketInfo:", promoHasMarketInfo);
				console.log("   • cartIsMarket:", cartIsMarket);
				console.log("   • cart tokens:", [...cartTokens]);
				console.log("   • promo tokens:", [...promoTokens]);
				console.log(
					"   • overlap (matching tokens):",
					[...promoTokens].filter((tk) => cartTokens.has(tk)),
				);

				let wrongMarket = false;
				if (cartIsMarket) {
					if (promoTokens.size > 0) {
						// Promo targets a market -> it must be the cart's market.
						wrongMarket = ![...promoTokens].some((tk) => cartTokens.has(tk));
					} else if (promoHasMarketInfo) {
						// Market field present but empty -> admin/global promo, which is
						// not allowed while the cart is from a specific market.
						wrongMarket = true;
					}
					// else: response carries no market info -> trust the backend result.
				} else {
					// Cart is from the main admin store -> reject market-scoped promos.
					wrongMarket = promoTokens.size > 0;
				}

				console.log(
					wrongMarket
						? "   ❌ RESULT: wrongMarket = true → promo REJECTED (different market)"
						: "   ✅ RESULT: wrongMarket = false → promo ACCEPTED (same market)",
				);
				console.log("========== 🎟️  PROMO DEBUG END ==========\n");

				if (wrongMarket) {
					setPromoCode("");
					setAppliedPromo(null);
					setDiscountAmount(0);
					Alert.alert(t("errorTitle"), t("promoWrongMarket"));
					return;
				}

				const applied = data.data as unknown as AppliedPromo;
				setAppliedPromo(applied);
				setDiscountAmount(applied.discountAmount);
				Alert.alert(
					t("success"),
					`${t("promoApplied")} $${applied.discountAmount.toFixed(2)}`,
				);
			} else {
				console.log(
					"❌ Backend rejected the code. message:",
					data.message || "(none)",
				);
				console.log("========== 🎟️  PROMO DEBUG END ==========\n");
				setPromoCode("");
				Alert.alert(t("errorTitle"), data.message || t("invalidPromoCode"));
			}
		} catch (error) {
			// A backend rejection (non-2xx) surfaces as ApiError — show its message
			// just like the previous non-success branch did.
			if (error instanceof ApiError) {
				const message = (error.payload as { message?: string } | null)?.message;
				console.log(
					"❌ Backend rejected the code. message:",
					message || "(none)",
				);
				console.log("========== 🎟️  PROMO DEBUG END ==========\n");
				setPromoCode("");
				Alert.alert(t("errorTitle"), message || t("invalidPromoCode"));
				return;
			}
			console.error("🔥 Error validating promo code:", error);
			console.log("========== 🎟️  PROMO DEBUG END ==========\n");
			setPromoCode("");
			Alert.alert(t("errorTitle"), t("validatePromoFailed"));
		} finally {
			setPromoLoading(false);
		}
	};

	const handleInput = (name: keyof CheckoutInputs, value: string): void => {
		setState((prev) => ({
			...prev,
			inputs: { ...prev.inputs, [name]: value },
		}));
	};

	const handleModalResponse = (response: string): void => {
		setShowModal(false);
		setModalResponse(response); // trigger child effect
	};

	const handleRemoveFromCart = (id: string): void => removeFromCart(id);

	useEffect(() => {
		console.log("🚚 Delivery Time:", deliveryTime);
		console.log("📅 ISO:", deliveryTime.toISOString());
		console.log("⏰ Local:", deliveryTime.toString());
	}, [deliveryTime]);

	if (state.loading) {
		return (
			<View style={styles.loadingContainer}>
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
				contentContainerStyle={styles.scrollContent}
			>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="chevron-left" size={24} color="#000000" />
				</TouchableOpacity>

				<Text style={[styles.heading, rtlText(isRTL)]}>{t("shippingInformation")}</Text>

				<TextInput
					style={styles.input}
					placeholder={t("emailRequiredField")}
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

				<View style={styles.countryWrapper}>
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

				<CityPicker
					value={state.inputs.city}
					onValueChange={(v) => handleInput("city", v)}
					placeholder={t("cityRequired")}
					disabled
					style={styles.cityPicker}
				/>

				<TextInput
					style={[styles.input, styles.inputDisabled]}
					placeholder={t("stateRequired")}
					value={state.inputs.state}
					editable={false}
				/>

				<View style={styles.row}>
					<TextInput
						style={[styles.input, styles.flex1]}
						placeholder={t("phoneRequired")}
						value={state.inputs.phone}
						keyboardType="phone-pad"
						onChangeText={(v) => handleInput("phone", v)}
					/>
				</View>

				<TextInput
					style={[styles.input, styles.inputDisabled]}
					placeholder={t("streetRequired")}
					value={state.inputs.street}
					editable={false}
				/>

				<Text style={[styles.heading, rtlText(isRTL)]}>{t("dtime")}</Text>

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

					{Platform.OS === "android" && showDatePicker && (
						<DateTimePicker
							value={deliveryTime}
							mode={pickerMode as "date" | "time"}
							display="default"
							minimumDate={new Date()}
							onChange={(event, selectedDate) => {
								if (event.type !== "set") {
									setShowDatePicker(false);
									setPickerMode("date");
									return;
								}

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
							}}
						/>
					)}
				</TouchableOpacity>

				<IOSDatePickerModal
					visible={Platform.OS === "ios" && showDatePicker}
					value={deliveryTime}
					mode="datetime"
					minimumDate={new Date()}
					onConfirm={(selectedDate) => {
						setDeliveryTime(selectedDate);
						setShowDatePicker(false);
					}}
					onCancel={() => setShowDatePicker(false)}
				/>
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("paymentMethod")}</Text>

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

				<Text style={[styles.heading, rtlText(isRTL)]}>{t("promoCode")}</Text>
				<View style={styles.promoCodeContainer}>
					<TextInput
						style={[styles.input, styles.flex1MarginRight10]}
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

				<Text style={[styles.heading, rtlText(isRTL)]}>{t("orderSummary")}</Text>

				{/* Market / source badge */}
				{(() => {
					const isMain = !cartSource || cartSource === MAIN_SOURCE;
					const label = marketDisplayName ?? (isMain ? "Frischly LB" : "Market");
					return (
						<View style={[styles.sourceBadge, isMain ? styles.sourceBadgeMain : styles.sourceBadgeMarket]}>
							<Ionicons
								name="storefront-outline"
								size={15}
								color={isMain ? "#1a6e2e" : "#7c4700"}
							/>
							<Text style={[styles.sourceBadgeText, isMain ? styles.textGreen : styles.textOrange]}>
								{label}
							</Text>
						</View>
					);
				})()}

				<View>
					{cart.map((item, index) => {
						const quantity = item.quantity || 1;
						const priceDetails = calculatePriceDetails(item, quantity);

						return (
							<View key={`${item._id}-${index}`} style={styles.cartItem}>
								<Image
									source={{ uri: item.picture?.replace("/upload/", "/upload/") || undefined }}
									style={styles.cartImage}
									resizeMode="contain"
								/>
								<View style={styles.flex1}>
									<Text>{item.title}</Text>
									<Text>
										{t("quantity")} {quantity}
									</Text>
									<Text style={styles.price}>
										${priceDetails.finalPrice.toFixed(2)}
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

				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text>{t("subtotal")}</Text>
					<Text>${subtotal.toFixed(2)}</Text>
				</View>
				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text>{t("delivery")}</Text>
					<Text>${deliveryFee.toFixed(2)}</Text>
				</View>
				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text>{t("processFees")}</Text>
					<Text> 0</Text>
				</View>
				{discountAmount > 0 && (
					<View style={[styles.summaryRow, rtlRow(isRTL)]}>
						<Text>{t("discount")}</Text>
						<Text>-${discountAmount.toFixed(2)}</Text>
					</View>
				)}
				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text style={styles.boldText}>{t("total")}</Text>
					<Text style={styles.boldText}>${total}</Text>
				</View>

				<OrderComponent
					items={cart}
					customer={state.user}
					phone={state.inputs.phone}
					onValidatePhone={() => {
						if (!isValidLebanesePhone(state.inputs.phone)) {
							Alert.alert(t("errorTitle"), t("phoneMustBe78Digits"));
							return false;
						}
						return true;
					}}
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
						<Text style={styles.modalTitle}>
							{t("ageVerificationTitle")}
						</Text>

						<Text style={styles.modalSubtitle}>
							{t("ageVerification")}
						</Text>

						{/* Buttons container */}
						<View style={styles.modalButtons}>
							{/* YES BUTTON */}
							<TouchableOpacity
								onPress={() => handleModalResponse("yes")}
								style={styles.modalYesButton}
							>
								<Text style={styles.modalYesText}>
									{t("yes")}
								</Text>
							</TouchableOpacity>

							{/* NO BUTTON */}
							<TouchableOpacity
								onPress={() => handleModalResponse("no")}
								style={styles.modalNoButton}
							>
								<Text style={styles.modalNoText}>
									{t("no")}
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

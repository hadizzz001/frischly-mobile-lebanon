import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Banknote, CreditCard, MapPin, Store, Tag, Trash2, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OrderComponent from "@/components/CreateOrderButton";
import IOSDatePickerModal from "@/components/IOSDatePickerModal";
import AppBottomSheet from "@/components/ui/AppBottomSheet";
import BackButton from "@/components/ui/BackButton";
import EmptyState from "@/components/ui/EmptyState";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { MAIN_STORE_NAME } from "@/constants/brand";
import { colors, icon } from "@/constants/theme";
import { MAIN_SOURCE, useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { useUsdToLbpRate } from "@/hooks/useUsdToLbpRate";
import { ApiError, MarketService, PromoCodeService } from "@/services/api";
import { styles } from "@/styles/app/checkout.styles";
import type { Address } from "@/types";
import type {
	AppliedPromo,
	CheckoutInputs,
	CheckoutState,
} from "@/types/app/checkout.types";
import {
	clearCheckoutSession,
	loadCheckoutSession,
	peekCheckoutSession,
	type CheckoutSession,
} from "@/utils/checkoutSession";
import { formatLbp, formatUsd } from "@/utils/currency";
import { computeDeliveryFee, getDeliveryConfig, type DeliveryConfig } from "@/utils/deliveryFee";
import { notifyError, notifySuccess } from "@/utils/haptics";
import { interpolate } from "@/utils/i18n";
import { collectMarketTokens } from "@/utils/market";
import { formatLebanesePhoneInput, isValidLebanesePhone } from "@/utils/phone";
import { rtlRow, rtlText } from "@/utils/rtl";
import { formatStreetLine } from "@/utils/userAddress";

// Checkout's form state, filled from the shopper's profile (or empty and
// loading when there is no session yet).
const stateFromSession = (session: CheckoutSession | null): CheckoutState => ({
	loading: !session,
	user: session?.user ?? null,
	token: session?.token ?? null,
	inputs: {
		name: session?.user.name || "",
		email: session?.user.email || "",
		phone: session?.user.phoneNumber || "",
		country: "LB",
		state: session?.user.address?.state || "",
		city: session?.user.address?.city || "",
		street: session?.user.address?.street || "",
	},
	country: "LB",
});

export default function CheckoutScreen() {
	const { t, td, isRTL } = useTranslation();
	const rate = useUsdToLbpRate();
	const [showModal, setShowModal] = useState<boolean>(false);
	const [riderNotes, setRiderNotes] = useState("");
	const [promoError, setPromoError] = useState<string | null>(null);
	const [modalResponse, setModalResponse] = useState<string | null>(null);
	const [paymentMethod, setPaymentMethod] = useState<string>("card"); // "card" or "cash"
	const [promoCode, setPromoCode] = useState<string>("");
	const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null); // { promoCode: {...}, discountAmount: number }
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [promoLoading, setPromoLoading] = useState<boolean>(false);

	const { cart, removeFromCart, subtotal, calculatePriceDetails, cartSource, cartMarket } =
		useCart();
	const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
		deliveryFee: 0,
		freeDeliveryThreshold: 0,
	});
	// Dynamic delivery fee: the store's flat fee, waived once the cart subtotal
	// reaches its free-delivery threshold. Recomputes as the subtotal changes.
	const deliveryFee = useMemo(
		() => computeDeliveryFee(deliveryConfig, Number(subtotal)),
		[deliveryConfig, subtotal],
	);
	const [total, setTotal] = useState<string>("0.00");
	const [marketDisplayName, setMarketDisplayName] = useState<string | null>(null);

	// Resolve the market name: cartMarket may be a populated object, a string ID,
	// or null (main store). The single-market endpoint requires auth, so we always
	// use the public list to look up by ID.
	useEffect(() => {
		if (!cartSource || cartSource === MAIN_SOURCE) {
			setMarketDisplayName(MAIN_STORE_NAME);
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

	// Delivery config of the store this cart belongs to — FreshlyLB's own
	// (Setting.deliveryFee/freeDeliveryThreshold) or the market's. The actual
	// fee is derived from the live subtotal below (dynamic: free once the
	// subtotal reaches the threshold). The backend charges the same figure when
	// the order is created, so the total shown is what the shopper actually pays.
	useEffect(() => {
		let cancelled = false;
		const marketId =
			!cartSource || cartSource === MAIN_SOURCE ? null : cartSource;
		getDeliveryConfig(marketId)
			.then((config) => {
				if (!cancelled) setDeliveryConfig(config);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [cartSource]);

	const [deliveryTime, setDeliveryTime] = useState(new Date());
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [pickerMode, setPickerMode] = useState("date"); // "date" | "time"

	const router = useRouter();

	// Unified state. The checkout button that opened this screen has already
	// verified the session and loaded the profile (hooks/useGoToCheckout.ts),
	// so the page renders complete on its first frame — no "Loading user
	// info…" page flashing in and out between the cart and here.
	const [state, setState] = useState<CheckoutState>(() =>
		stateFromSession(peekCheckoutSession()),
	);

	useEffect(() => {
		clearCheckoutSession();
		if (!state.loading) return;

		// Opened some other way: load the session here instead. A guest, a
		// missing token or a failed /me goes to sign in first.
		let cancelled = false;
		loadCheckoutSession().then((session) => {
			if (cancelled) return;
			if (!session) {
				router.replace("/start");
				return;
			}
			setState(stateFromSession(session));
		});
		return () => {
			cancelled = true;
		};
		// Mount only: `state.loading` is the initial value on purpose.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router]);

	const calculateTotal = (): string => {
		const s = Number(subtotal);
		const d = Number(deliveryFee);
		const disc = Number(discountAmount);

		// Final total (subtract discount). No processing fee is charged.
		const totalAmount = s + d - disc;

		return Math.max(totalAmount, 0).toFixed(2); // Ensure total doesn't go negative
	};

	useEffect(() => {
		setTotal(calculateTotal());
	}, [subtotal, deliveryFee, discountAmount]);

	const validatePromoCode = async (): Promise<void> => {
		if (!promoCode.trim()) {
			setPromoError(t("enterPromoCodeFirst"));
			return;
		}
		setPromoError(null);
		setPromoLoading(true);

		// ----------------------- DEBUG: entered code + cart market -----------------
		// Trim: Android keyboards add a trailing space after autocomplete, and
		// "ABC " is not "ABC" to the server.
		const enteredCode = promoCode.trim().toUpperCase();
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
				code: enteredCode,
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
					notifyError();
					setPromoError(t("promoWrongMarket"));
					return;
				}

				const applied = data.data as unknown as AppliedPromo;
				setAppliedPromo(applied);
				setDiscountAmount(applied.discountAmount);
				notifySuccess();
			} else {
				console.log(
					"❌ Backend rejected the code. message:",
					data.message || "(none)",
				);
				console.log("========== 🎟️  PROMO DEBUG END ==========\n");
				setPromoCode("");
				notifyError();
				setPromoError(data.message || t("invalidPromoCode"));
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
				notifyError();
				setPromoError(message || t("invalidPromoCode"));
				return;
			}
			console.error("🔥 Error validating promo code:", error);
			console.log("========== 🎟️  PROMO DEBUG END ==========\n");
			setPromoCode("");
			notifyError();
			setPromoError(t("validatePromoFailed"));
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

	const { isBusy, anyBusy, run } = useBusyAction();

	const handleRemoveFromCart = (id: string): void =>
		run(`remove-${id}`, () => removeFromCart(id));

	// Address the order will ship to. Read-only on purpose: the city is bound
	// to the catalog the cart was built from, so it can only be changed from
	// the home screen's location pill (which handles the cart-zone conflict)
	// or the profile — never mid-checkout.
	const address: Address | null | undefined = state.user?.address;
	const hasPin =
		typeof address?.location?.latitude === "number" &&
		typeof address?.location?.longitude === "number";
	const addressLine = formatStreetLine(address);

	const isMain = !cartSource || cartSource === MAIN_SOURCE;
	const storeLabel = marketDisplayName ?? (isMain ? MAIN_STORE_NAME : t("market"));
	const totalNumber = Number(total) || 0;

	if (state.loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator color={colors.primary} />
				<Text style={styles.text}>{t("loadingUserInfo")}</Text>
			</View>
		);
	}

	if (!cart || cart.length === 0) {
		return (
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<EmptyState
					illustration="basket"
					title={t("cartEmptyTitle")}
					description={t("cartEmptyBody")}
					actionLabel={t("continueShopping")}
					onAction={() => router.push("/shop")}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView edges={["top"]} style={styles.safeArea}>
			<View style={[styles.topBar, rtlRow(isRTL)]}>
				<BackButton />
				<Text style={styles.topBarTitle}>{t("shippingInformation")}</Text>
			</View>

			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
			>
				{/* --- Address card ------------------------------------------------ */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("deliveryAddress")}</Text>
				<View style={[styles.addressCard, !hasPin && styles.addressCardMissing]}>
					<View style={[styles.addressRow, rtlRow(isRTL)]}>
						<View style={styles.addressIcon}>
							<MapPin size={icon.size} strokeWidth={icon.strokeWidth} color={hasPin ? colors.primaryDark : colors.warning} />
						</View>
						<View style={styles.flex1}>
							<Text style={[styles.addressTitle, rtlText(isRTL)]} numberOfLines={1}>
								{hasPin ? address?.city || t("selectCity") : t("addDeliveryAddress")}
							</Text>
							<Text style={[styles.addressSub, rtlText(isRTL)]} numberOfLines={2}>
								{hasPin ? addressLine || t("manageAddress") : t("addressSetFromHome")}
							</Text>
						</View>
					</View>
				</View>

				{/* --- Contact ------------------------------------------------------ */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("contactDetails")}</Text>
				<FormField label={t("fullName")} value={state.inputs.name} onChangeText={(v) => handleInput("name", v)} autoCapitalize="words" />
				<FormField
					label={t("phoneLabel")}
					prefix="+961"
					ltr
					value={state.inputs.phone.replace(/^\+?961/, "").trim()}
					onChangeText={(v) => handleInput("phone", formatLebanesePhoneInput(v))}
					keyboardType="phone-pad"
					maxLength={9}
					hint={t("phoneHint")}
				/>
				<FormField label={t("emailLabel")} value={state.inputs.email} editable={false} />

				{/* --- Delivery details ------------------------------------------- */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("deliveryDetails")}</Text>
				<FormField
					label={t("dtime")}
					value={deliveryTime.toLocaleString("en-US", {
						month: "short",
						day: "2-digit",
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
					})}
					onPressField={() => setShowDatePicker(true)}
				/>
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
							const newDate = selectedDate || deliveryTime;
							setDeliveryTime(newDate);
							if (pickerMode === "date") {
								setPickerMode("time");
							} else {
								setShowDatePicker(false);
								setPickerMode("date");
							}
						}}
					/>
				)}
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
				<FormField
					label={t("riderInstructionsLabel")}
					value={riderNotes}
					onChangeText={setRiderNotes}
					placeholder={t("riderInstructionsPlaceholder")}
					multiline
					numberOfLines={2}
					maxLength={300}
				/>

				{/* --- Payment ------------------------------------------------------ */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("payment")}</Text>
				<View style={[styles.paymentOptions, rtlRow(isRTL)]}>
					{(
						[
							{ key: "card", label: t("onlinePayment"), Icon: CreditCard },
							{ key: "cash", label: t("cashOnDelivery"), Icon: Banknote },
						] as const
					).map(({ key, label, Icon }) => {
						const active = paymentMethod === key;
						return (
							<Pressable
								key={key}
								style={[styles.paymentOption, active && styles.paymentOptionSelected]}
								onPress={() => setPaymentMethod(key)}
								accessibilityRole="radio"
								accessibilityState={{ selected: active }}
							>
								<Icon size={icon.sizeLarge} strokeWidth={icon.strokeWidth} color={active ? colors.primaryDark : colors.textSecondary} />
								<Text style={[styles.paymentOptionText, active && styles.paymentOptionTextSelected]}>{label}</Text>
							</Pressable>
						);
					})}
				</View>

				{/* --- Promo code ------------------------------------------------- */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("promoCode")}</Text>
				{appliedPromo ? (
					<View style={[styles.promoApplied, rtlRow(isRTL)]}>
						<Tag size={icon.size} strokeWidth={icon.strokeWidth} color={colors.success} />
						<Text style={styles.promoAppliedText}>
							{interpolate(t("promoCodeApplied"), { amount: formatUsd(discountAmount) })}
						</Text>
						<Pressable
							onPress={() => {
								setAppliedPromo(null);
								setDiscountAmount(0);
								setPromoCode("");
							}}
							hitSlop={8}
						>
							<X size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
						</Pressable>
					</View>
				) : (
					<View>
						<View style={[styles.promoCodeContainer, rtlRow(isRTL)]}>
							<View style={styles.flex1}>
								<FormField
									label={t("enterPromoCode")}
									value={promoCode}
									onChangeText={(text) => {
										setPromoCode(text);
										if (promoError) setPromoError(null);
									}}
									autoCapitalize="characters"
									autoCorrect={false}
									error={promoError}
									showError={false}
									containerStyle={{ marginBottom: 0 }}
								/>
							</View>
							<PrimaryButton
								label={t("apply")}
								onPress={validatePromoCode}
								loading={promoLoading}
								style={styles.applyButton}
							/>
						</View>
						{/* Under the whole row, not inside the field: the server's
						    messages can be a full sentence, and an inline error used
						    to grow the field and drop the button below the input. */}
						{promoError ? (
							<Text style={[styles.promoError, rtlText(isRTL)]}>{promoError}</Text>
						) : null}
					</View>
				)}

				{/* --- Order summary --------------------------------------------- */}
				<Text style={[styles.heading, rtlText(isRTL)]}>{t("orderSummary")}</Text>
				<View style={[styles.sourceBadge, rtlRow(isRTL)]}>
					<Store size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
					<Text style={styles.sourceBadgeText}>{storeLabel}</Text>
				</View>
				<View style={styles.itemsCard}>
					{cart.map((item, index) => {
						const quantity = item.quantity || 1;
						const priceDetails = calculatePriceDetails(item, quantity);
						return (
							<View key={`${item._id}-${index}`} style={[styles.cartItem, rtlRow(isRTL), index === cart.length - 1 && styles.cartItemLast]}>
								<View style={styles.cartImageWrap}>
									<Image source={{ uri: item.picture || undefined }} style={styles.cartImage} contentFit="contain" cachePolicy="memory-disk" />
								</View>
								<View style={styles.flex1}>
									<Text style={[styles.itemName, rtlText(isRTL)]} numberOfLines={2}>
										{td(item.name)}
									</Text>
									<Text style={[styles.text, rtlText(isRTL)]}>
										{t("quantity")} {quantity}
									</Text>
								</View>
								<Text style={styles.price}>{formatUsd(priceDetails.finalPrice)}</Text>
								<Pressable onPress={() => handleRemoveFromCart(item._id)} disabled={anyBusy} hitSlop={8} style={styles.removeBtn}>
									{isBusy(`remove-${item._id}`) ? (
										<ActivityIndicator size="small" color={colors.textMuted} />
									) : (
										<Trash2 size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
									)}
								</Pressable>
							</View>
						);
					})}
				</View>
			</ScrollView>

			{/* --- Sticky order bar ---------------------------------------------- */}
			{/* The bottom nav under this bar already clears the home indicator. */}
			<View style={[styles.stickyBar, { paddingBottom: 12 }]}>
				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text style={styles.summaryLabel}>{t("subtotal")}</Text>
					<Text style={styles.summaryValue}>{formatUsd(Number(subtotal))}</Text>
				</View>
				<View style={[styles.summaryRow, rtlRow(isRTL)]}>
					<Text style={styles.summaryLabel}>{t("deliveryFee")}</Text>
					<Text style={styles.summaryValue}>{deliveryFee > 0 ? formatUsd(deliveryFee) : t("free")}</Text>
				</View>
				{discountAmount > 0 && (
					<View style={[styles.summaryRow, rtlRow(isRTL)]}>
						<Text style={styles.summaryLabel}>{t("discount")}</Text>
						<Text style={[styles.summaryValue, styles.summaryDiscount]}>-{formatUsd(discountAmount)}</Text>
					</View>
				)}
				<View style={[styles.summaryRow, styles.totalRow, rtlRow(isRTL)]}>
					<Text style={styles.totalLabel}>{t("totalAmount")}</Text>
					<View>
						<Text style={styles.totalValue}>{formatUsd(totalNumber)}</Text>
						<Text style={styles.totalLbp}>{interpolate(t("totalWithLbp"), { lbp: formatLbp(totalNumber, rate) })}</Text>
					</View>
				</View>
				<OrderComponent
					items={cart}
					customer={state.user}
					phone={state.inputs.phone}
					onValidatePhone={() => isValidLebanesePhone(state.inputs.phone)}
					setShowModal={setShowModal}
					modalResponse={modalResponse}
					paymentMethod={paymentMethod}
					deliveryTime={deliveryTime.toISOString()}
					appliedPromo={appliedPromo}
					discountAmount={discountAmount}
					notes={riderNotes}
					disabledReason={
						!hasPin
							? t("addressRequiredToOrder")
							: !isValidLebanesePhone(state.inputs.phone)
							? t("phoneMustBe78Digits")
							: null
					}
				/>
			</View>

			{/* Age check (18+ items) */}
			<AppBottomSheet visible={showModal} onClose={() => setShowModal(false)} scrollable={false}>
				<Text style={styles.sheetTitle}>{t("ageVerificationTitle")}</Text>
				<Text style={styles.sheetBody}>{t("ageVerification")}</Text>
				<View style={styles.sheetActions}>
					<PrimaryButton label={t("yes")} onPress={() => handleModalResponse("yes")} />
					<PrimaryButton label={t("no")} variant="secondary" onPress={() => handleModalResponse("no")} />
				</View>
			</AppBottomSheet>
		</SafeAreaView>
	);
}

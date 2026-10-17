import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CircleAlert, Minus, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	LayoutAnimation,
	Pressable,
	Text,
	View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

import AppBottomSheet from "@/components/ui/AppBottomSheet";
import EmptyState from "@/components/ui/EmptyState";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { colors, icon, spacing } from "@/constants/theme";
import { MAIN_SOURCE, useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { useGoToCheckout } from "@/hooks/useGoToCheckout";
import { useUsdToLbpRate } from "@/hooks/useUsdToLbpRate";
import { ProductService } from "@/services/api";
import { styles } from "@/styles/components/Cart.styles";
import type { CartItem } from "@/types";
import { formatLbp, formatUsd } from "@/utils/currency";
import { computeDeliveryFee, getDeliveryConfig, type DeliveryConfig } from "@/utils/deliveryFee";
import { notifyWarning, tapLight } from "@/utils/haptics";
import { interpolate } from "@/utils/i18n";

// Cart screen body: swipe-to-delete rows with an inline [- n +] stepper, a
// live out-of-stock check, and a sticky checkout bar (free-delivery progress,
// subtotal / delivery / total, ≈ LBP) pinned above the bottom nav.
export default function Cart() {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const rate = useUsdToLbpRate();
	const { cart, removeFromCart, subtotal, addToCart, calculatePriceDetails, clearCart, cartSource } =
		useCart();
	const { isBusy, anyBusy, run } = useBusyAction();
	const { goToCheckout: openCheckout, preparing: preparingCheckout } = useGoToCheckout();

	const [ageCheckOpen, setAgeCheckOpen] = useState(false);
	const [clearOpen, setClearOpen] = useState(false);
	const [clearing, setClearing] = useState(false);
	const swipeRefs = useRef<Map<string, Swipeable>>(new Map());

	// --- delivery config (free-delivery threshold progress) ----------------------
	const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({
		deliveryFee: 0,
		freeDeliveryThreshold: 0,
	});
	useEffect(() => {
		let cancelled = false;
		const marketId = !cartSource || cartSource === MAIN_SOURCE ? null : cartSource;
		getDeliveryConfig(marketId)
			.then((c) => {
				if (!cancelled) setDeliveryConfig(c);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [cartSource]);
	const deliveryFee = useMemo(
		() => computeDeliveryFee(deliveryConfig, Number(subtotal)),
		[deliveryConfig, subtotal],
	);
	const total = Math.max(Number(subtotal) + deliveryFee, 0);
	const threshold = deliveryConfig.freeDeliveryThreshold;
	const remainingForFree = threshold > 0 ? Math.max(threshold - Number(subtotal), 0) : 0;
	const progress = threshold > 0 ? Math.min(Number(subtotal) / threshold, 1) : 0;

	// --- live stock re-validation --------------------------------------------------
	// The cart carries the stock captured when an item was added; re-read it
	// so an item that sold out meanwhile is flagged here instead of failing at
	// the final order request.
	const [liveStock, setLiveStock] = useState<Record<string, number>>({});
	const [checkingStock, setCheckingStock] = useState(false);
	const ids = cart.map((c) => c._id).join(",");
	useEffect(() => {
		if (!ids) return;
		let cancelled = false;
		setCheckingStock(true);
		Promise.all(
			ids.split(",").map(async (id) => {
				try {
					const res = await ProductService.getById(id);
					const stock = Number(res?.data?.stock);
					return [id, Number.isFinite(stock) ? stock : NaN] as const;
				} catch {
					return [id, NaN] as const;
				}
			}),
		)
			.then((pairs) => {
				if (cancelled) return;
				const next: Record<string, number> = {};
				pairs.forEach(([id, stock]) => {
					if (Number.isFinite(stock)) next[id] = stock;
				});
				setLiveStock(next);
			})
			.finally(() => {
				if (!cancelled) setCheckingStock(false);
			});
		return () => {
			cancelled = true;
		};
	}, [ids]);

	const stockOf = (item: CartItem): number | null => {
		const live = liveStock[item._id];
		if (Number.isFinite(live)) return live;
		const captured = Number(item?.stock);
		return Number.isFinite(captured) && captured > 0 ? captured : null;
	};
	const isUnavailable = (item: CartItem) => liveStock[item._id] === 0;
	const hasUnavailable = cart.some(isUnavailable);

	// --- actions ------------------------------------------------------------------------
	const handleRemove = useCallback(
		(itemId: string) => {
			notifyWarning();
			LayoutAnimation.easeInEaseOut();
			run(`remove-${itemId}`, () => removeFromCart(itemId));
		},
		[removeFromCart, run],
	);

	const changeQuantity = (item: CartItem, nextQuantity: number, key: string) => {
		const max = stockOf(item);
		const capped = max === null ? nextQuantity : Math.min(nextQuantity, max);
		if (capped < 1) return;
		tapLight();
		run(key, () => {
			addToCart(item, capped);
		});
	};

	// The button itself shows the spinner while checkout's data loads (see
	// useGoToCheckout); checkout then opens complete, with no loading page.
	const goToCheckout = () => {
		if (hasUnavailable) return;
		if (cart.some((item) => item?.is18Plus === true)) {
			setAgeCheckOpen(true);
			return;
		}
		openCheckout();
	};

	const confirmAge = (isAdult: boolean) => {
		setAgeCheckOpen(false);
		if (isAdult) openCheckout();
	};

	// --- rows ------------------------------------------------------------------------------
	const renderDeleteAction = (itemId: string) => (
		<Pressable
			style={styles.deleteAction}
			onPress={() => {
				swipeRefs.current.get(itemId)?.close();
				handleRemove(itemId);
			}}
			accessibilityRole="button"
			accessibilityLabel={t("removeItem")}
		>
			<Trash2 size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textOnDark} />
			<Text style={styles.deleteActionText}>{t("removeItem")}</Text>
		</Pressable>
	);

	const renderItem = ({ item }: { item: CartItem }) => {
		const quantity = item.quantity || 1;
		const priceDetails = calculatePriceDetails(item, quantity);
		const unit = calculatePriceDetails(item, 1).finalPrice;
		const max = stockOf(item);
		const unavailable = isUnavailable(item);
		const canIncrease = !unavailable && (max === null || quantity < max);

		return (
			<View>
				<Swipeable
					ref={(ref) => {
						if (ref) swipeRefs.current.set(item._id, ref);
						else swipeRefs.current.delete(item._id);
					}}
					renderRightActions={isRTL ? undefined : () => renderDeleteAction(item._id)}
					renderLeftActions={isRTL ? () => renderDeleteAction(item._id) : undefined}
					onSwipeableWillOpen={tapLight}
					overshootRight={false}
					overshootLeft={false}
					friction={2}
				>
					<View
						style={[
							styles.cartItem,
							isRTL && { flexDirection: "row-reverse" },
							unavailable && styles.cartItemUnavailable,
						]}
					>
						<Pressable onPress={() => router.push(`/product/${item._id}`)} style={styles.itemImageWrap}>
							<Image
								source={{ uri: item.picture || undefined }}
								style={[styles.itemImage, unavailable && styles.itemImageUnavailable]}
								contentFit="contain"
								cachePolicy="memory-disk"
							/>
						</Pressable>

						<View style={styles.details}>
							<Pressable onPress={() => router.push(`/product/${item._id}`)}>
								<Text style={styles.itemTitle} numberOfLines={2}>
									{td(item.name)}
								</Text>
							</Pressable>
							<Text style={styles.unitPrice}>{formatUsd(unit)} × {quantity}</Text>

							<View style={[styles.rowBottom, isRTL && { flexDirection: "row-reverse" }]}>
								<View style={styles.stepper}>
									<Pressable
										style={[styles.stepBtn, quantity <= 1 && styles.stepBtnDisabled]}
										onPress={() => changeQuantity(item, quantity - 1, `dec-${item._id}`)}
										disabled={quantity <= 1 || anyBusy}
										accessibilityRole="button"
										accessibilityLabel="-"
									>
										{isBusy(`dec-${item._id}`) ? (
											<ActivityIndicator size="small" color={colors.text} />
										) : (
											<Minus size={icon.sizeSmall} strokeWidth={2.5} color={colors.text} />
										)}
									</Pressable>
									<Text style={styles.qtyValue}>{String(quantity)}</Text>
									<Pressable
										style={[styles.stepBtn, !canIncrease && styles.stepBtnDisabled]}
										onPress={() => changeQuantity(item, quantity + 1, `inc-${item._id}`)}
										disabled={!canIncrease || anyBusy}
										accessibilityRole="button"
										accessibilityLabel="+"
									>
										{isBusy(`inc-${item._id}`) ? (
											<ActivityIndicator size="small" color={colors.text} />
										) : (
											<Plus size={icon.sizeSmall} strokeWidth={2.5} color={colors.text} />
										)}
									</Pressable>
								</View>
								<Text style={styles.price}>{formatUsd(priceDetails.finalPrice)}</Text>
							</View>
						</View>
					</View>
				</Swipeable>

				{unavailable && (
					<View style={[styles.unavailableBanner, isRTL && { flexDirection: "row-reverse" }]}>
						<CircleAlert size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.warning} />
						<Text style={styles.unavailableText}>{t("itemOutOfStockBanner")}</Text>
						<Pressable onPress={() => handleRemove(item._id)} hitSlop={8}>
							{isBusy(`remove-${item._id}`) ? (
								<ActivityIndicator size="small" color={colors.text} />
							) : (
								<Text style={[styles.unavailableText, { color: colors.link, textDecorationLine: "underline" }]}>
									{t("removeItem")}
								</Text>
							)}
						</Pressable>
					</View>
				)}
			</View>
		);
	};

	if (!cart || cart.length === 0) {
		return (
			<View style={styles.container}>
				<EmptyState
					illustration="basket"
					title={t("cartEmptyTitle")}
					description={t("cartEmptyBody")}
					actionLabel={t("startShopping")}
					onAction={() => router.push("/shop")}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.heading}>{t("cartTitle")}</Text>
			<Text style={styles.hint}>
				{checkingStock ? t("checkingStock") : t("swipeToDeleteHint")}
			</Text>

			<FlatList
				data={cart}
				keyExtractor={(item, index) => `${item._id}-${index}`}
				renderItem={renderItem}
				contentContainerStyle={styles.listContent}
				showsVerticalScrollIndicator={false}
			/>

			{/* Sticky checkout bar — decoupled from the scroll view. The bottom
			    nav right below it already clears the home indicator, so no
			    safe-area padding is added here (it left a blank band). */}
			<View style={[styles.footer, { paddingBottom: spacing.sm }]}>
				{threshold > 0 && (
					<View style={styles.progressWrap}>
						<Text style={styles.progressText}>
							{remainingForFree > 0
								? interpolate(t("freeDeliveryProgress"), { amount: formatUsd(remainingForFree) })
								: t("freeDeliveryUnlocked")}
						</Text>
						<View style={styles.progressTrack}>
							<View
								style={[
									styles.progressFill,
									{ width: `${Math.round(progress * 100)}%` },
									progress >= 1 && styles.progressFillDone,
								]}
							/>
						</View>
					</View>
				)}

				<View style={[styles.summaryRow, isRTL && { flexDirection: "row-reverse" }]}>
					<Text style={styles.summaryLabel}>{t("subtotal")}</Text>
					<Text style={styles.summaryValue}>{formatUsd(Number(subtotal))}</Text>
				</View>
				<View style={[styles.summaryRow, isRTL && { flexDirection: "row-reverse" }]}>
					<Text style={styles.summaryLabel}>{t("deliveryFee")}</Text>
					<Text style={styles.summaryValue}>
						{deliveryFee > 0 ? formatUsd(deliveryFee) : t("free")}
					</Text>
				</View>
				<View style={[styles.summaryRow, styles.totalRow, isRTL && { flexDirection: "row-reverse" }]}>
					<Text style={styles.totalLabel}>{t("totalAmount")}</Text>
					<View>
						<Text style={styles.totalValue}>{formatUsd(total)}</Text>
						<Text style={styles.totalLbp}>
							{t("approx")} {formatLbp(total, rate)}
						</Text>
					</View>
				</View>

				<PrimaryButton
					label={hasUnavailable ? t("cartHasOutOfStock") : t("goToCheckout")}
					onPress={goToCheckout}
					loading={preparingCheckout}
					disabled={hasUnavailable || anyBusy}
					style={styles.checkoutBtn}
				/>
				<Pressable style={styles.clearCartLink} onPress={() => setClearOpen(true)}>
					<Text style={styles.clearCartText}>{t("clearCart")}</Text>
				</Pressable>
			</View>

			{/* Age check (18+ items) as a bottom sheet instead of a modal dialog. */}
			<AppBottomSheet visible={ageCheckOpen} onClose={() => setAgeCheckOpen(false)} scrollable={false}>
				<Text style={styles.sheetTitle}>{t("ageVerificationTitle")}</Text>
				<Text style={styles.sheetBody}>{t("ageVerification")}</Text>
				<View style={styles.sheetActions}>
					<PrimaryButton label={t("yes")} onPress={() => confirmAge(true)} />
					<PrimaryButton label={t("no")} variant="secondary" onPress={() => confirmAge(false)} />
				</View>
			</AppBottomSheet>

			{/* Clear-cart confirmation. */}
			<AppBottomSheet visible={clearOpen} onClose={() => setClearOpen(false)} scrollable={false}>
				<Text style={styles.sheetTitle}>{t("clearCartTitle")}</Text>
				<Text style={styles.sheetBody}>{t("clearCartConfirm")}</Text>
				<View style={styles.sheetActions}>
					<PrimaryButton
						label={t("clearCart")}
						variant="danger"
						loading={clearing}
						onPress={async () => {
							setClearing(true);
							try {
								await clearCart();
							} finally {
								setClearing(false);
								setClearOpen(false);
							}
						}}
					/>
					<PrimaryButton label={t("cancel")} variant="secondary" onPress={() => setClearOpen(false)} />
				</View>
			</AppBottomSheet>
		</View>
	);
}

import { colors, icon } from "@/constants/theme";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { OrderService, ProductService } from "@/services/api";
import { styles } from "@/styles/components/RepeatOrderButton.styles";
import type { Product } from "@/types";
import type { RepeatOrderButtonProps } from "@/types/components/RepeatOrderButton.types";
import { buildRepeatCartItems, getLatestOrder } from "@/utils/order";
import { rtlRow } from "@/utils/rtl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RotateCcw, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

/** Remembers, per account, which order's card was closed or used. */
const HIDDEN_KEY_PREFIX = "repeat_order_hidden_v1_";

// Floating "Order again" card: puts the shopper's latest order back in the
// cart in one tap. The ✕ closes it, and it removes itself once the order has
// been added — both are remembered for that order, so the card only comes
// back after the shopper places a new one. While it is showing, the screen
// adds bottom space (onVisibilityChange) so no product stays stuck under it.
export default function RepeatOrderButton({ onVisibilityChange }: RepeatOrderButtonProps) {
	const { t, isRTL } = useTranslation();
	const { addItemsToCart } = useCart();
	const [loading, setLoading] = useState<boolean>(false);
	// The latest order's id, and the order whose card was closed/used.
	const [latestOrderId, setLatestOrderId] = useState<string | null>(null);
	const [hiddenOrderId, setHiddenOrderId] = useState<string | null>(null);
	const [hiddenKey, setHiddenKey] = useState<string | null>(null);

	const visible = !!latestOrderId && latestOrderId !== hiddenOrderId;

	useEffect(() => {
		let isMounted = true;

		const load = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");
				const parsed = userData ? JSON.parse(userData) : null;

				// Guests or users without a token never see the card.
				if (!parsed?.token || guest === "true") return;

				const key = `${HIDDEN_KEY_PREFIX}${parsed?.user?._id ?? "user"}`;
				const [res, hidden] = await Promise.all([OrderService.list(), AsyncStorage.getItem(key)]);
				const latest = getLatestOrder(Array.isArray(res?.data) ? res.data : []);
				if (!isMounted) return;
				setHiddenKey(key);
				setHiddenOrderId(hidden);
				setLatestOrderId(latest?._id ?? null);
			} catch {
				// No card when the orders can't be read.
			}
		};

		load();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		onVisibilityChange?.(visible);
	}, [visible, onVisibilityChange]);

	const hideFor = (orderId: string | null) => {
		if (!orderId) return;
		setHiddenOrderId(orderId);
		if (hiddenKey) AsyncStorage.setItem(hiddenKey, orderId).catch(() => {});
	};

	const fetchCurrentProduct = async (productId: string): Promise<Product | null> => {
		try {
			const res = await ProductService.getById(productId);
			return res?.data || null;
		} catch {
			return null;
		}
	};

	// Adds the latest order once — see buildRepeatCartItems for why the
	// quantities no longer compound from one tap to the next.
	const handleRepeatOrder = async () => {
		if (loading) return;

		try {
			setLoading(true);

			const userData = await AsyncStorage.getItem("userData");
			const token = userData ? JSON.parse(userData)?.token : null;

			if (!token) {
				Alert.alert(t("errorTitle"), t("repeatOrderLoginRequired"));
				return;
			}

			const res = await OrderService.list();
			const latestOrder = getLatestOrder(res?.data || []);

			if (!latestOrder?.items?.length) {
				Alert.alert(t("errorTitle"), t("repeatOrderNoPrevious"));
				return;
			}

			const { items, skipped } = await buildRepeatCartItems(latestOrder, fetchCurrentProduct);

			if (items.length === 0) {
				Alert.alert(t("errorTitle"), t("repeatOrderNoAvailableItems"));
				return;
			}

			// Not added = the cart asked first (different store) or the shopper
			// is a guest being sent to sign in — neither is a success.
			if (!addItemsToCart(items).added) return;

			// Done with this order: the card goes away.
			hideFor(latestOrder._id);
			Alert.alert(
				t("success"),
				skipped > 0 ? t("repeatOrderAddedWithSkipped") : t("repeatOrderAdded"),
			);
		} catch (error) {
			Alert.alert(t("errorTitle"), (error as Error)?.message || t("repeatOrderFailed"));
		} finally {
			setLoading(false);
		}
	};

	if (!visible) return null;

	return (
		<Animated.View
			entering={FadeInDown.duration(250)}
			exiting={FadeOutDown.duration(200)}
			style={styles.floating}
			pointerEvents="box-none"
		>
			<View style={[styles.card, rtlRow(isRTL)]}>
				<Pressable
					onPress={handleRepeatOrder}
					disabled={loading}
					style={({ pressed }) => [styles.main, rtlRow(isRTL), pressed && styles.pressed]}
					accessibilityRole="button"
					accessibilityLabel={t("repeatOrder")}
					accessibilityState={{ busy: loading }}
				>
					<View style={styles.iconCircle}>
						<RotateCcw size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
					</View>
					<View style={styles.textWrap}>
						<Text style={styles.title} numberOfLines={1}>
							{t("repeatOrderTitle")}
						</Text>
						<Text style={styles.subtitle} numberOfLines={2}>
							{t("repeatOrderSubtitle")}
						</Text>
					</View>
					{/* The action pill; shows the spinner while the order is re-added. */}
					<View style={styles.action}>
						{loading ? (
							<ActivityIndicator size="small" color={colors.primaryText} />
						) : (
							<Text style={styles.actionText} numberOfLines={1}>
								{t("repeatOrderShort")}
							</Text>
						)}
					</View>
				</Pressable>
				<Pressable
					onPress={() => hideFor(latestOrderId)}
					hitSlop={10}
					style={({ pressed }) => [styles.close, pressed && styles.pressed]}
					accessibilityRole="button"
					accessibilityLabel={t("close")}
				>
					<X size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
				</Pressable>
			</View>
		</Animated.View>
	);
}

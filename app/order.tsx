"use client";
import LoadingButton from "@/components/LoadingButton";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService, OrderService, ProductService } from "@/services/api";
import type { Order, OrderItem, Product, User } from "@/types";
import { rtlRow, rtlText } from "@/utils/rtl";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	AppState,
	FlatList,
	Image,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ORDERS_POLL_MS as POLL_MS } from "@/constants/timing";
import { styles } from "@/styles/app/order.styles";

export default function TestOrder() {
	const { t, td, language, isRTL } = useTranslation();
	const [user, setUser] = useState<User | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
	const [productImages, setProductImages] = useState<Record<string, string | null>>({}); // ✅ Cache for product images
	const router = useRouter();
	const { cart, addItemsToCart } = useCart();
	const [cancelModalVisible, setCancelModalVisible] = useState<boolean>(false);
	const [cancelReason, setCancelReason] = useState<string>("");
	const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
	const [repeatingOrderId, setRepeatingOrderId] = useState<string | null>(null);

	const getStatusText = (status: string): string => {
		switch (status) {
			case "pending":
				return t("pending");
			case "delivered":
				return t("delivered");
			case "shipped":
				return t("shipped");
			case "cancelled":
				return t("cancelled");
			default:
				return status;
		}
	};

	// Color + background for the status pill, so it's easy to spot an order's
	// state at a glance: green = delivered, red = cancelled, blue = shipped (on
	// the way), amber = pending.
	const getStatusMeta = (status: string): { color: string; background: string } => {
		switch (status) {
			case "delivered":
				return { color: "#15803d", background: "#e3f6ea" };
			case "shipped":
				return { color: "#1d4ed8", background: "#e7edff" };
			case "cancelled":
				return { color: "#dc2626", background: "#fce9e8" };
			case "pending":
			default:
				return { color: "#b45309", background: "#fdf1dd" };
		}
	};

	// Human friendly "Jul 6, 2026, 3:45 PM" style date for the order header.
	const formatOrderDate = (dateStr?: string): string => {
		if (!dateStr) return "";
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return "";
		return date.toLocaleString(language === "ar" ? "ar" : "en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
			hour: "numeric",
			minute: "2-digit",
		});
	};

	const promptCancelOrder = (orderId: string): void => {
		setSelectedOrderId(orderId);
		setCancelReason("");
		setCancelModalVisible(true);
	};

	const [cancelling, setCancelling] = useState<boolean>(false);

	const handleCancel = async (): Promise<void> => {
		console.log("🚀 Attempting to cancel order:", selectedOrderId);
		console.log("📝 Cancel Reason:", cancelReason);

		if (!cancelReason.trim()) {
			Alert.alert(t("errorTitle"), t("provideReason"));
			return;
		}

		if (cancelling) return;
		setCancelling(true);
		try {
			const userData = await AsyncStorage.getItem("userData");
			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;

			console.log("🔑 Token Found:", token ? "YES" : "NO");

			if (!token) {
				console.log("❌ No token found in AsyncStorage");
				Alert.alert(t("errorTitle"), t("notAuthenticated"));
				return;
			}

			if (!selectedOrderId) return;

			try {
				const res = await OrderService.cancel(selectedOrderId, cancelReason);
				console.log("📨 Response Body:", JSON.stringify(res));
				console.log("✅ Order cancelled successfully!");
				setOrders((prev) =>
					prev.map((o) =>
						o._id === selectedOrderId ? { ...o, status: "cancelled" } : o
					)
				);
				setCancelModalVisible(false);
				Alert.alert(t("success"), t("orderCancelled"));
			} catch (cancelErr) {
				console.log("❌ Failed to cancel.", cancelErr);
				Alert.alert(t("errorTitle"), t("cancelFailed"));
			}
		} catch (e) {
			console.error("🔥 Exception during cancellation:", e);
			Alert.alert(t("errorTitle"), t("errorOccurred"));
		} finally {
			setCancelling(false);
		}
	};

	// Fetch the logged-in user + their orders. Called on mount, on an interval,
	// and whenever the app returns to the foreground so order status changes
	// (e.g. shipped -> delivered) show up automatically — no manual refresh.
	const fetchOrders = async ({ silent = false }: { silent?: boolean } = {}): Promise<void> => {
		try {
			if (!silent) setLoading(true);

			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) return;

			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;
			if (!token) return;

			// Fetch user info
			try {
				const meRes = await AuthService.me();
				const fetchedUser = (meRes.data as unknown as { user?: User })?.user;
				if (fetchedUser) setUser(fetchedUser);
			} catch {
				// ignore user fetch failure
			}

			// Fetch orders
			try {
				const ordersRes = await OrderService.list();
				setOrders(ordersRes.data || []);
			} catch {
				console.error("Failed to fetch orders");
			}
		} catch (err) {
			console.error("Error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchOrders();
	}, []);

	// ✅ Auto-sync: silently re-fetch orders on an interval and whenever the app
	// comes back to the foreground, so status changes are reflected without the
	// shopper needing to pull-to-refresh or reopen the screen.
	useEffect(() => {
		const timer = setInterval(() => fetchOrders({ silent: true }), POLL_MS);
		const subscription = AppState.addEventListener("change", (nextState) => {
			if (nextState === "active") fetchOrders({ silent: true });
		});

		return () => {
			clearInterval(timer);
			subscription.remove();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Auto-expand pending orders
	useEffect(() => {
		if (orders.length > 0) {
			const pendingOrders = orders.filter(
				(order) => order.status === "pending"
			);
			if (pendingOrders.length > 0) {
				setExpandedOrders((prev) => {
					const newExpanded = { ...prev };
					pendingOrders.forEach((order) => {
						if (newExpanded[order._id] === undefined) {
							newExpanded[order._id] = true;
						}
					});
					return newExpanded;
				});
			}
		}
	}, [orders]);

	const fetchProductImage = async (productId: string): Promise<string | null> => {
		if (productImages[productId]) return productImages[productId]; // ✅ Cached version

		try {
			const res = await ProductService.getById(productId);
			const img = res?.data?.picture || null;

			setProductImages((prev) => ({ ...prev, [productId]: img }));
			return img;
		} catch (e) {
			console.error("Error fetching product image", e);
			return null;
		}
	};

	// -------- Repeat this specific order --------
	// Adds every item from THIS order to the cart — never items from a
	// different order. Each product is re-fetched so out-of-stock/deactivated
	// items are skipped. An order's items always share a single source (main
	// store or one market) because the cart only ever lets you check out one
	// source at a time. If that source conflicts with what's already in the
	// cart, addItemsToCart asks the shopper before replacing anything instead
	// of silently mixing markets.
	const getOrderItemProductId = (orderItem: OrderItem): string | undefined => {
		const product = orderItem?.product;
		return typeof product === "string" ? product : product?._id;
	};

	const fetchCurrentProduct = async (productId: string): Promise<Product | null> => {
		try {
			const res = await ProductService.getById(productId);
			return res?.data ?? null;
		} catch (e) {
			console.error("Error fetching product for repeat order", e);
			return null;
		}
	};

	const handleRepeatOrder = async (order: Order): Promise<void> => {
		if (repeatingOrderId) return;

		const orderItems = order?.items || [];
		if (orderItems.length === 0) {
			Alert.alert(t("errorTitle"), t("repeatOrderNoAvailableItems"));
			return;
		}

		try {
			setRepeatingOrderId(order._id);

			let addedCount = 0;
			let skippedCount = 0;
			const repeatCartItems = [];

			for (const orderItem of orderItems) {
				const productId = getOrderItemProductId(orderItem);
				if (!productId) {
					skippedCount += 1;
					continue;
				}

				const product = await fetchCurrentProduct(productId);
				const stock = Number(product?.stock || 0);

				if (!product || product.isActive === false || stock <= 0) {
					skippedCount += 1;
					continue;
				}

				const existingCartItem = cart.find(
					(cartItem) => String(cartItem._id) === String(product._id)
				);
				const existingQuantity = Number(existingCartItem?.quantity || 0);
				const requestedQuantity = Number(orderItem.quantity || 1);
				const quantity = Math.min(existingQuantity + requestedQuantity, stock);

				repeatCartItems.push({ ...product, quantity });
				addedCount += 1;
			}

			if (addedCount === 0) {
				Alert.alert(t("errorTitle"), t("repeatOrderNoAvailableItems"));
				return;
			}

			addItemsToCart(repeatCartItems);

			Alert.alert(
				t("success"),
				skippedCount > 0
					? t("repeatOrderAddedWithSkipped")
					: t("repeatOrderAdded")
			);
		} catch (error) {
			Alert.alert(t("errorTitle"), (error as Error)?.message || t("repeatOrderFailed"));
		} finally {
			setRepeatingOrderId(null);
		}
	};

	const ProductRow = ({ item }: { item: OrderItem }) => {
		const product = item.product as Product;
		const [image, setImage] = useState<string | null>(product.picture || null);

		useEffect(() => {
			if (!image) {
				fetchProductImage(product._id).then(setImage);
			}
		}, []);

		return (
			<View style={[styles.itemRow, rtlRow(isRTL)]}>
				{image ? (
					<Image source={{ uri: image }} style={styles.itemImage} />
				) : (
					<View style={[styles.itemImage, styles.itemImagePlaceholder]}>
						<Feather name="image" size={18} color="#c4c4c4" />
					</View>
				)}
				<View style={styles.itemInfo}>
					<Text style={[styles.itemName, rtlText(isRTL)]} numberOfLines={2}>
						{td(product.name)}
					</Text>
					<View style={[styles.itemMetaRow, rtlRow(isRTL)]}>
						<Text style={styles.itemMetaText}>
							{t("quantity")} {item.quantity}
						</Text>
						<Text style={styles.itemPriceText}>
							${(item.totalPrice ?? 0).toFixed(2)}
						</Text>
					</View>
				</View>
			</View>
		);
	};

	const renderOrderItem = (item: Order) => {
		const canPay = item.status === "pending";
		const canCancel = item.status !== "delivered" && item.status !== "cancelled";
		const canTrack =
			item.assignedRider &&
			item.status !== "delivered" &&
			item.status !== "cancelled";
		// Repeating only makes sense once the order has actually been
		// delivered — not for pending/shipped/cancelled orders.
		const canRepeat = item.status === "delivered";
		const isRepeating = repeatingOrderId === item._id;
		const hasActions = canTrack || canPay || canCancel || canRepeat;

		return (
			<View style={styles.itemsContainer}>
				{item.items.map((i) => (
					<ProductRow key={i._id} item={i} />
				))}

				{/* Action buttons: track / pay / cancel / repeat — small, compact
				    chips that stay aligned on a single row. Only rendered when at
				    least one action applies to this order's status. */}
				{hasActions && (
				<View style={styles.actionRow}>
					{canTrack && (
						<TouchableOpacity
							style={[styles.actionBtn, styles.trackBtn]}
							onPress={() =>
								router.push({
									pathname: `/track/${item._id}` as never,
									params: { orderNumber: item.orderNumber },
								})
							}
						>
							<Feather name="map-pin" size={12} color="#fff" />
							<Text style={styles.actionBtnText}>{t("trackShort")}</Text>
						</TouchableOpacity>
					)}

					{canPay && (
						<TouchableOpacity
							style={[styles.actionBtn, styles.payBtn]}
							onPress={() => {
								if (item.paymentUrl) {
									router.push(item.paymentUrl as never);
								}
							}}
						>
							<Feather name="credit-card" size={12} color="#fff" />
							<Text style={styles.actionBtnText}>{t("pay")}</Text>
						</TouchableOpacity>
					)}

					{canCancel && (
						<TouchableOpacity
							style={[styles.actionBtn, styles.cancelBtn]}
							onPress={() => promptCancelOrder(item._id)}
						>
							<Feather name="x-circle" size={12} color="#fff" />
							<Text style={styles.actionBtnText}>{t("cancel")}</Text>
						</TouchableOpacity>
					)}

					{canRepeat && (
						<TouchableOpacity
							style={[styles.actionBtn, styles.repeatBtn]}
							disabled={repeatingOrderId !== null}
							onPress={() => handleRepeatOrder(item)}
						>
							{isRepeating ? (
								<ActivityIndicator size="small" color="#222222" />
							) : (
								<>
									<Feather name="refresh-cw" size={12} color="#222222" />
									<Text style={[styles.actionBtnText, styles.repeatBtnText]}>
										{t("repeatOrderShort")}
									</Text>
								</>
							)}
						</TouchableOpacity>
					)}
				</View>
				)}
			</View>
		);
	};

	if (loading) {
		return (
			<ActivityIndicator
				size="large"
				style={styles.loadingIndicator}
			/>
		);
	}

	if (!orders.length) {
		return (
			<View style={styles.container}>
				<Text>{t("noOrdersFound")}</Text>
			</View>
		);
	}

	const toggleExpand = (id: string, status: string): void => {
		setExpandedOrders((prev) => {
			const newState = { ...prev, [id]: !prev[id] };
			// Auto-expand if status is pending
			if (status === "pending" && !prev[id]) {
				newState[id] = true;
			}
			return newState;
		});
	};

	const renderItem = ({ item }: { item: Order }) => {
		const statusMeta = getStatusMeta(item.status);
		const expanded = !!expandedOrders[item._id];

		return (
			<View style={styles.orderCard}>
				<TouchableOpacity
					style={[styles.orderHeader, rtlRow(isRTL)]}
					activeOpacity={0.7}
					onPress={() => toggleExpand(item._id, item.status)}
				>
					<View style={styles.orderHeaderLeft}>
						<Text style={[styles.orderId, rtlText(isRTL)]}>{item.orderNumber}</Text>
						{!!item.createdAt && (
							<Text style={[styles.orderDate, rtlText(isRTL)]}>
								{formatOrderDate(item.createdAt)}
							</Text>
						)}
						<View
							style={[
								styles.statusBadge,
								{ backgroundColor: statusMeta.background },
							]}
						>
							<View
								style={[styles.statusDot, { backgroundColor: statusMeta.color }]}
							/>
							<Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>
								{getStatusText(item.status) || t("pending")}
							</Text>
						</View>
						<Text style={[styles.paymentMethod, rtlText(isRTL)]}>
							{item.paymentMethod === "cash"
								? t("cashOnDelivery")
								: t("onlinePayment")}
						</Text>
					</View>

					<View style={styles.orderHeaderRight}>
						<Text style={[styles.summaryText, rtlText(isRTL)]}>
							{t("subtotal")}: ${(item.subtotal ?? 0).toFixed(2)}
						</Text>
						<Text style={[styles.summaryText, rtlText(isRTL)]}>
							{t("delivery")}: ${item.delivery?.toFixed(2) || "0.00"}
						</Text>
						<Text style={[styles.totalText, rtlText(isRTL)]}>
							{t("total")}: ${(item.total ?? 0).toFixed(2)}
						</Text>
					</View>

					<Feather
						name={expanded ? "chevron-up" : "chevron-down"}
						size={20}
						color="#b5b5b5"
						style={styles.chevron}
					/>
				</TouchableOpacity>

				{expanded && renderOrderItem(item)}
			</View>
		);
	};

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			<View style={styles.container}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="chevron-left" size={24} color="#000000" />
				</TouchableOpacity>
				<FlatList
					data={orders}
					keyExtractor={(item) => item._id}
					renderItem={renderItem}
					contentContainerStyle={styles.listContent} // ✅ ensures content not cut off
				/>

				<Modal
					animationType="slide"
					transparent={true}
					visible={cancelModalVisible}
					onRequestClose={() => setCancelModalVisible(false)}
				>
					<View
						style={styles.cancelModalOverlay}
					>
						<View
							style={styles.cancelModalCard}
						>
							<Text style={styles.cancelModalTitle}>
								{t("reasonCancellation")}
							</Text>
							<TextInput
								value={cancelReason}
								onChangeText={setCancelReason}
								placeholder={t("typeReason")}
								style={styles.cancelModalInput}
								multiline
							/>
							<View
								style={styles.cancelModalActions}
							>
								<TouchableOpacity
									onPress={() => setCancelModalVisible(false)}
									style={styles.cancelModalCancelBtn}
								>
									<Text style={styles.cancelModalCancelText}>
										{t("cancel")}
									</Text>
								</TouchableOpacity>
								<LoadingButton
									onPress={handleCancel}
									style={styles.cancelModalSubmitBtn}
									loadingColor="#fff"
								>
									<Text style={styles.cancelModalSubmitText}>
										{t("submit")}
									</Text>
								</LoadingButton>
							</View>
						</View>
					</View>
				</Modal>
			</View>
		</SafeAreaView>
	);
}

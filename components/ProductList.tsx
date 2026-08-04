"use client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService, ProductService } from "@/services/api";
import type { CartItem, Product, User } from "@/types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { getUserCityAndPin } from "@/utils/userCity";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 15;
const LIMIT = 12; // items per fetch

function formatWeight(weight: unknown): string {
	if (weight === null || weight === undefined) return "";
	if (typeof weight === "string" || typeof weight === "number") return String(weight);
	if (typeof weight === "object") {
		const w = weight as { value?: string | number; unit?: string };
		if (w.value !== undefined) return `${w.value}${w.unit ? ` ${w.unit}` : ""}`;
		if (w.unit !== undefined) return String(w.unit);
	}
	return "";
}

interface ShopPageProps {
	refreshTrigger?: number;
	setRefreshing: (refreshing: boolean) => void;
	// When set, list THIS market's products (skipping the admin city gate)
	// instead of the main store's.
	marketId?: string;
}

export default function ShopPage({ refreshTrigger, setRefreshing, marketId }: ShopPageProps) {
	const { t, td } = useTranslation();
	const router = useRouter();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingMore, setLoadingMore] = useState<boolean>(false);
	const [page, setPage] = useState<number>(1);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [user, setUser] = useState<User | null>(null);
	// inside ShopPage component

	const { addToCart, removeFromCart, cart } = useCart();
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [showQty, setShowQty] = useState<Record<string, boolean>>({}); // track which products show quantity

	// Keep the +/- quantity UI in sync with the actual cart (also reflects a
	// cart "restore" when switching markets).
	useEffect(() => {
		const nextQuantities: Record<string, number> = {};
		const nextShowQty: Record<string, boolean> = {};
		cart.forEach((cartItem: CartItem) => {
			nextQuantities[cartItem._id] = cartItem.quantity || 1;
			nextShowQty[cartItem._id] = true;
		});
		setQuantities(nextQuantities);
		setShowQty(nextShowQty);
	}, [cart]);

	const increaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;

		// ✅ STOP IF REACH STOCK LIMIT
		if (currentQty >= product.stock) {
			return; // or Alert.alert("Stock limit reached")
		}

		const newQty = currentQty + 1;
		// Adding from a different market shows a confirm dialog and is applied
		// asynchronously, so only reflect the change locally when it was added.
		const result = addToCart(product, newQty);
		if (result?.added) {
			setQuantities({ ...quantities, [product._id]: newQty });
			setShowQty({ ...showQty, [product._id]: true });
		}
	};

	const decreaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;

		if (currentQty <= 1) {
			const updatedQuantities = { ...quantities };
			delete updatedQuantities[product._id];
			setQuantities(updatedQuantities);
			removeFromCart(product._id);
			setShowQty({ ...showQty, [product._id]: false });
		} else {
			const newQty = currentQty - 1;
			setQuantities({ ...quantities, [product._id]: newQty });
			addToCart(product, newQty);
		}
	};

	const toggleCart = () => setBooleanValue(!isBooleanValue);

	// Fetch products
	const fetchProducts = async (pageNum: number = 1) => {
		try {
			pageNum === 1 ? setLoading(true) : setLoadingMore(true);
			if (pageNum === 1) {
				setPage(1);
				setHasMore(true);
			}

			// Market mode: list THIS market's products. Markets have their own city
			// filtering, so the admin city gate does not apply here.
			if (marketId) {
				const res = await ProductService.list({
					page: pageNum,
					limit: LIMIT,
					isActive: true,
					inAds: "all",
					stockLevel: "Available",
					sortBy: "price",
					sortOrder: "desc",
					market: marketId,
				});
				const marketProducts = res.data || [];
				if (marketProducts.length < LIMIT) setHasMore(false);
				setProducts((prev) =>
					pageNum === 1 ? marketProducts : [...prev, ...marketProducts]
				);
				return;
			}

			// Main-store (admin) items are only shown to users in a city the admin
			// serves AND whose exact map pin falls inside the admin's configured
			// delivery-range circle(s), when set. Guests (no city/pin) and an
			// unconfigured admin still see everything.
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setProducts([]);
				setHasMore(false);
				return;
			}

			// Home product list shows main-store items only (no market products).
			const res = await ProductService.list({
				page: pageNum,
				limit: LIMIT,
				isActive: true,
				inAds: "all",
				stockLevel: "Available",
				sortBy: "price",
				sortOrder: "desc",
				market: "none",
			});
			const newProducts = res.data || [];

			if (newProducts.length < LIMIT) setHasMore(false); // no more products
			setProducts((prev) =>
				pageNum === 1 ? newProducts : [...prev, ...newProducts]
			);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	useEffect(() => {
		fetchProducts(1);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [marketId]);

	useEffect(() => {
		if (refreshTrigger && refreshTrigger > 0) {
			setRefreshing(true);
			fetchProducts(1).finally(() => setRefreshing(false));
		}
	}, [refreshTrigger, setRefreshing]);

	// Check login & fetch user
	useEffect(() => {
		const checkLogin = async () => {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) {
				router.replace("/start");
			} else {
				try {
					const res = await AuthService.me();
					const payload = res.data as unknown as { user?: User };
					setUser(payload?.user ?? null);
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
				setLoading(false);
			}
		};
		checkLogin();
	}, []);

	const renderItem = ({ item }: { item: Product }) => {
		const basePrice = item.price || 0;
		const discountPercent = item.discount || 0;
		const taxPercent = item.tax || 0;
		const bottleRefund = item.bottlerefund || 0;

		const discountAmount = (basePrice * discountPercent) / 100;
		const priceAfterDiscount = basePrice - discountAmount;
		const taxAmount = (priceAfterDiscount * taxPercent) / 100;
		const finalPrice = priceAfterDiscount;

		return (
			<TouchableOpacity
				key={item._id}
				onPress={() => router.push(`/product/${item._id}`)}
				activeOpacity={0.8}
				style={styles.card}
			>
				<View style={styles.imageWrapper}>
					<Image
						source={{ uri: item.picture || "https://via.placeholder.com/150" }}
						style={styles.image}
						resizeMode="contain"
					/>
					{item.stock === 0 && (
						<View style={styles.outOfStockOverlay}>
							<Text style={styles.outOfStockText}>{t("out")}</Text>
						</View>
					)}
					{discountPercent > 0 && (
						<View style={styles.discountBadge}>
							<Text style={styles.discountText}>-{discountPercent}%</Text>
						</View>
					)}
				</View>
				<Text style={styles.name} numberOfLines={2}>
					{td(item.name)}
				</Text>

				{basePrice !== finalPrice ? (
					<View style={styles.priceRow}>
						<Text style={styles.basePrice}>${basePrice.toFixed(2)}</Text>
						<Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>
					</View>
				) : (
					<View style={styles.priceRow}>
						<Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>
					</View>
				)}

				{/* Quantity buttons only if product is in stock */}
				{item.stock > 0 && (
					<View style={styles.qtyRow}>
						{showQty[item._id] ? (
							<>
								<TouchableOpacity
									onPress={() => decreaseQty(item)}
									style={styles.qtyBtn}
								>
									<Text style={styles.qtyText}>-</Text>
								</TouchableOpacity>
								<Text style={styles.qtyValue}>{quantities[item._id] || 1}</Text>
								<TouchableOpacity
									onPress={() => increaseQty(item)}
									style={styles.qtyBtn}
								>
									<Text style={styles.qtyText}>+</Text>
								</TouchableOpacity>
							</>
						) : (
							<TouchableOpacity
								onPress={() => increaseQty(item)}
								style={[styles.qtyBtn, styles.qtyBtnCartPadding]}
							>
								<Feather name="shopping-cart" size={20} color="#fff" />
							</TouchableOpacity>
						)}
					</View>
				)}
			</TouchableOpacity>
		);
	};

	const handleLoadMore = () => {
		if (!loadingMore && hasMore) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchProducts(nextPage);
		}
	};

	if (loading && page === 1) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	// Group products into rows of 3. This component renders inside the home
	// screen's vertical ScrollView, so a nested vertical FlatList would trigger
	// the "VirtualizedLists should never be nested" warning. We render the grid
	// with plain Views instead (the parent ScrollView handles scrolling).
	const rows = [];
	for (let i = 0; i < products.length; i += 3) {
		rows.push(products.slice(i, i + 3));
	}

	return (
		<View style={styles.container}>
			<View style={styles.grid}>
				{rows.map((row, rowIndex) => (
					<View key={`row-${rowIndex}`} style={styles.row}>
						{row.map((item) => renderItem({ item }))}
						{/* Fill the last row's empty slots so cards stay left-aligned. */}
						{row.length < 3 &&
							Array.from({ length: 3 - row.length }).map((_, i) => (
								<View
									key={`spacer-${rowIndex}-${i}`}
									style={styles.gridItem}
								/>
							))}
					</View>
				))}

				{loadingMore && <ActivityIndicator style={styles.loadingMoreIndicator} />}
				{!loadingMore && hasMore && (
					<TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore}>
						<Text style={styles.loadMoreText}>{t("loadMore")}</Text>
					</TouchableOpacity>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	gridItem: { width: ITEM_WIDTH, margin: 5 },
	container: { flex: 1 },
	grid: { padding: 10 },
	row: { flexDirection: "row" },
	card: { width: ITEM_WIDTH, margin: 5, backgroundColor: "#fff", padding: 8 },

	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },
	outOfStockOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	outOfStockText: { color: "#fff", fontWeight: "700", fontSize: 16 },
	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "red",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#fff", fontSize: 12, fontWeight: "700" },
	name: { fontSize: 13, fontWeight: "500", marginBottom: 4, color: "#777" },
	weight: { fontSize: 11, color: "#999", marginBottom: 4 },
	finalPrice: { fontSize: 15, fontWeight: "700", color: "#333" },
	basePrice: {
		textDecorationLine: "line-through",
		color: "#777",
		marginRight: 6,
		fontSize: 13,
	},
	priceRow: { flexDirection: "row", alignItems: "center" },
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
	},
	loadMoreBtn: {
		margin: 20,
		padding: 12,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		alignItems: "center",
	},
	loadMoreText: {
		color: "#333",
		fontWeight: "700",
		fontSize: 16,
	},
	qtyRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
	},
	qtyBtn: {
		backgroundColor: "#f4bb26",
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
		marginHorizontal: 4,
	},
	qtyText: { fontSize: 14, fontWeight: "700", color: "#fff" },
	qtyValue: {
		marginHorizontal: 6,
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	qtyBtnCartPadding: {
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	loadingMoreIndicator: {
		margin: 20,
	},
});

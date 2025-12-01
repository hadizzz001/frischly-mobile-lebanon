"use client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
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

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 15;
const LIMIT = 10; // items per fetch

export default function ShopPage({ refreshTrigger, setRefreshing }) {
	const { t } = useTranslation();
	const router = useRouter();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [user, setUser] = useState(null);
	// inside ShopPage component

	const { addToCart, removeFromCart, cart } = useCart();
	const [quantities, setQuantities] = useState({});
	const [showQty, setShowQty] = useState({}); // track which products show quantity

	const increaseQty = (product) => {
		const currentQty = quantities[product._id] || 0;

		// ✅ STOP IF REACH STOCK LIMIT
		if (currentQty >= product.stock) {
			return; // or Alert.alert("Stock limit reached")
		}

		const newQty = currentQty + 1;
		setQuantities({ ...quantities, [product._id]: newQty });
		addToCart(product, newQty);
		setShowQty({ ...showQty, [product._id]: true });
	};

	const decreaseQty = (product) => {
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

	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	const toggleCart = () => setBooleanValue(!isBooleanValue);

	// Fetch products
	const fetchProducts = async (pageNum = 1) => {
		try {
			pageNum === 1 ? setLoading(true) : setLoadingMore(true);
			if (pageNum === 1) {
				setPage(1);
				setHasMore(true);
			}

			const res = await fetch(
				`https://frischlyshop-server.onrender.com/api/products?page=${pageNum}&limit=${LIMIT}&isActive=true&inAds=all&stockLevel=Available&sortBy=categorySortOrder&sortOrder=asc`
			);
			const json = await res.json();
			const newProducts = json.data || [];

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
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) {
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
					const res = await fetch(
						"https://frischlyshop-server.onrender.com/api/auth/me",
						{
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						}
					);

					if (res.ok) {
						const data = await res.json();
						setUser(data.data.user);
					} else {
						console.error("❌ Failed to fetch user:", res.status);
					}
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
				setLoading(false);
			}
		};
		checkLogin();
	}, []);

	const renderItem = ({ item }) => {
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
					{item.name}
				</Text>

				{basePrice !== finalPrice ? (
					<View style={styles.priceRow}>
						<Text style={styles.basePrice}>€{basePrice.toFixed(2)}</Text>
						<Text style={styles.finalPrice}>€{finalPrice.toFixed(2)}</Text>
					</View>
				) : (
					<View style={styles.priceRow}>
						<Text style={styles.finalPrice}>€{finalPrice.toFixed(2)}</Text>
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
								style={[
									styles.qtyBtn,
									{ paddingHorizontal: 12, paddingVertical: 6 },
								]}
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
				<ActivityIndicator size="large" color="#ffc300" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				contentContainerStyle={styles.grid}
				data={products}
				keyExtractor={(item) => item._id}
				renderItem={renderItem}
				numColumns={3} // changed from 2 to 3
				ListFooterComponent={
					<>
						{loadingMore && <ActivityIndicator style={{ margin: 20 }} />}
						{!loadingMore && hasMore && (
							<TouchableOpacity
								style={styles.loadMoreBtn}
								onPress={handleLoadMore}
							>
								<Text style={styles.loadMoreText}>{t("loadMore")}</Text>
							</TouchableOpacity>
						)}
					</>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	grid: { padding: 10 },
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
		backgroundColor: "#ffc300",
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
		backgroundColor: "#ffc300",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 4,
	},
	qtyText: { fontSize: 14, fontWeight: "700", color: "#fff" },
	qtyValue: {
		marginHorizontal: 6,
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
});

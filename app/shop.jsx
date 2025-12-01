"use client";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 12; // 3 items per row, adjust margin

export default function ShopPage() {
	const { t } = useTranslation();

	const router = useRouter();
	const searchParams = useLocalSearchParams();

	console.log("Sear ", searchParams);

	// ✅ discount & category from query params
	const discountParam = searchParams.discount ?? "";
	const categoryParam = searchParams.category ?? "";

	const [menuOpen, setMenuOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [user, setUser] = useState(null);
	const [filterOpen, setFilterOpen] = useState(false);
	const [subcategories, setSubcategories] = useState([]);
	const searchParam = searchParams.search ?? "";
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);

	const [filters, setFilters] = useState({
		search: searchParam,
		subcategory: "",
		shelfNumber: "",
		sortBy: "price",
		sortOrder: "asc",
		priceRange: "1-20",
		stockLevel: "",
		discount: false,
		minDiscount: 5,
	});
	// Inside ShopPage component

	const { cart, addToCart, removeFromCart } = useCart();
	const [quantities, setQuantities] = useState({});
	const [showQty, setShowQty] = useState({}); // Track which products show qty

	const increaseQty = (product) => {
		const currentQty = quantities[product._id] || 0;

		// ✅ Do not allow exceeding stock
		if (currentQty >= product.stock) {
			return; // Stop here if qty == stock
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

	// ✅ Fetch categories
	useEffect(() => {
		fetch("https://frischlyshop-server.onrender.com/api/categories")
			.then((res) => res.json())
			.then((json) => setCategories(json.data || []))
			.catch((err) => console.error(err));
	}, []);

	useEffect(() => {
		const getSubcategories = async () => {
			try {
				const res = await fetch(
					"https://frischlyshop-server.onrender.com/api/subcategories"
				);
				const json = await res.json();
				if (json.success) {
					setSubcategories(json.data); // <-- only use the "data" array
				}
			} catch (err) {
				console.error("Failed to fetch subcategories:", err);
			}
		};

		getSubcategories();
	}, []);

	const fetchProducts = async (nextPage = 1, replace = false) => {
		try {
			if (nextPage === 1) setLoading(true);
			else setIsFetchingMore(true);

			const params = new URLSearchParams();
			params.append("page", nextPage);
			params.append("limit", 12);

			// include filters (NO MANUAL ENCODING)
			if (filters.search) params.append("search", filters.search);
			if (filters.subcategory)
				params.append("subcategory", filters.subcategory);

			if (filters.sortBy) {
				params.append("sortBy", filters.sortBy);
				params.append("sortOrder", filters.sortOrder);
			}

			if (filters.priceRange) params.append("priceRange", filters.priceRange);
			if (filters.stockLevel) params.append("stockLevel", filters.stockLevel);

			// include category & discount param from query
			if (categoryParam) params.append("category", categoryParam);

			let url;

			if (discountParam === "true") {
				url = `https://frischlyshop-server.onrender.com/api/products/discount?limit=1000`;
			} else {
				url = `https://frischlyshop-server.onrender.com/api/products?${params.toString()}`;
			}

			console.log("URL:", url);

			const res = await fetch(url);
			const json = await res.json();

			const newData = Array.isArray(json.data) ? json.data : [];

			setProducts((prev) => {
				if (replace) return newData;
				const existingIds = new Set(prev.map((p) => p._id));
				const uniqueNewData = newData.filter((p) => !existingIds.has(p._id));
				return [...prev, ...uniqueNewData];
			});
			setHasNextPage(json.pagination?.hasNextPage ?? false);
		} catch (err) {
			console.error("fetchProducts error:", err);
		} finally {
			setLoading(false);
			setIsFetchingMore(false);
		}
	};

	useEffect(() => {
		setPage(1);
		fetchProducts(1, true); // replace = true so it starts fresh
	}, [categoryParam, discountParam]);

	// ✅ Check login & fetch user
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

	const loadMore = () => {
		if (!hasNextPage || isFetchingMore) return;

		const nextPage = page + 1;
		setPage(nextPage);
		fetchProducts(nextPage, false); // append instead of replace
	};

	const renderProduct = ({ item }) => {
		const basePrice = item.price || 0;
		const discountPercent = item.discount || 0;
		const taxPercent = item.tax || 0;
		const bottleRefund = item.bottlerefund || 0;

		const discountAmount = (basePrice * discountPercent) / 100;
		const priceAfterDiscount = basePrice - discountAmount;
		const taxAmount = (priceAfterDiscount * taxPercent) / 100;
		const finalPrice = priceAfterDiscount;

		const isQtyVisible = showQty[item._id] || false;

		return (
			<View style={styles.card}>
				<TouchableOpacity
					onPress={() => router.push(`/product/${item._id}`)}
					activeOpacity={0.8}
				>
					<View style={styles.imageWrapper}>
						<Image
							source={{ uri: item.picture }}
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
							<Text style={styles.newPrice}>€{finalPrice.toFixed(2)}</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* Add to Cart / Quantity Selector */}
				{item.stock > 0 && (
					<View style={styles.qtyRow}>
						{isQtyVisible ? (
							<View style={styles.qtyContainer}>
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
							</View>
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
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color="#ffc300" />
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			<View style={styles.container}>
				{/* Back arrow + Categories */}
				<View style={styles.categoryHeader}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="chevron-left" size={24} color="#000000" />
					</TouchableOpacity>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.categoryBar}
						contentContainerStyle={{ alignItems: "center" }}
					>
						{/* All button */}
						<TouchableOpacity
							style={[
								styles.categoryBtn,
								!categoryParam &&
									discountParam !== "true" && {
										backgroundColor: "#ffc300",
									},
							]}
							onPress={() => router.push("/shop")}
						>
							<Text
								style={[
									styles.categoryText,
									!categoryParam &&
										discountParam !== "true" && {
											color: "#000",
											fontWeight: "700",
										},
								]}
							>
								{t("all")}
							</Text>
						</TouchableOpacity>

						{/* Dynamic categories */}
						{categories.map((cat) => {
							const isSelected = categoryParam === cat.name;
							return (
								<TouchableOpacity
									key={cat._id}
									style={[
										styles.categoryBtn,
										isSelected && { backgroundColor: "#ffc300" },
									]}
									onPress={() =>
										router.push(
											`/shop?category=${encodeURIComponent(cat.name)}`
										)
									}
								>
									<Text
										style={[
											styles.categoryText,
											isSelected && { color: "#000", fontWeight: "700" },
										]}
									>
										{cat.name}
									</Text>
								</TouchableOpacity>
							);
						})}
					</ScrollView>

					<TouchableOpacity
						style={[styles.categoryBtn, { backgroundColor: "#ddd" }]}
						onPress={() => setFilterOpen(true)}
					>
						<Feather name="sliders" size={18} color="#000" />
					</TouchableOpacity>
				</View>

				{/* Products Grid */}
				<FlatList
					contentContainerStyle={{ paddingBottom: 120 }}
					data={products}
					keyExtractor={(item) => item._id}
					renderItem={renderProduct}
					numColumns={3} // <-- 3 items per row
					onEndReached={loadMore}
					onEndReachedThreshold={0.3}
					ListFooterComponent={
						isFetchingMore ? (
							<ActivityIndicator size="small" color="#ffc300" />
						) : null
					}
				/>

				{/* ✅ Filter Overlay */}
				{filterOpen && (
					<View style={[styles.filterOverlay, { left: width * 0.3 }]}>
						{/* Close button */}
						<TouchableOpacity
							style={styles.closeBtn}
							onPress={() => setFilterOpen(false)}
						>
							<Feather name="x" size={28} color="#000" />
						</TouchableOpacity>

						<ScrollView contentContainerStyle={{ padding: 20 }}>
							<Text style={styles.title}>{t("filterProducts")}</Text>

							{/* Search Field */}
							<TextInput
								placeholder={t("searchPlaceholder")}
								value={filters.search}
								onChangeText={(v) => setFilters((p) => ({ ...p, search: v }))}
								style={styles.input}
							/>

							{/* Subcategory Picker */}
							<Text style={{ marginTop: 20, marginBottom: 5 }}>
								Subcategory
							</Text>
							<View style={styles.input}>
								<Picker
									selectedValue={filters.subcategory}
									onValueChange={(v) =>
										setFilters((p) => ({ ...p, subcategory: v }))
									}
								>
									<Picker.Item label={t("subcategory")} value="" />
									{subcategories.map((sub) => (
										<Picker.Item
											key={sub._id}
											label={sub.name}
											value={sub.name}
										/>
									))}
								</Picker>
							</View>

							{/* Sort Dropdown */}
							<Text style={{ marginTop: 20, marginBottom: 5 }}>
								{t("sortBy")}
							</Text>
							<View style={styles.input}>
								<Picker
									selectedValue={`${filters.sortBy}_${filters.sortOrder}`}
									onValueChange={(v) => {
										const [sortBy, sortOrder] = v.split("_");
										setFilters((p) => ({ ...p, sortBy, sortOrder }));
									}}
								>
									<Picker.Item label="Price: Low to High" value="price_asc" />
									<Picker.Item label="Price: High to Low" value="price_desc" />
									<Picker.Item label="Name: A to Z" value="name_asc" />
									<Picker.Item label="Name: Z to A" value="name_desc" />
									<Picker.Item label="Newest First" value="createdAt_desc" />
									<Picker.Item label="Oldest First" value="createdAt_asc" />
								</Picker>
							</View>

							{/* Discount Toggle */}
							<TouchableOpacity
								onPress={() =>
									setFilters((p) => ({ ...p, discount: !p.discount }))
								}
								style={styles.checkboxRow}
							>
								<Text style={{ color: "#000" }}>{t("onlyDiscounted")}</Text>
								<View
									style={[
										styles.checkbox,
										filters.discount && styles.checkboxActive,
									]}
								/>
							</TouchableOpacity>

							{/* Price Range Picker */}
							<Text style={{ marginTop: 20, marginBottom: 5 }}>
								{t("priceRange")}
							</Text>
							<View style={styles.input}>
								<Picker
									selectedValue={filters.priceRange}
									onValueChange={(v) =>
										setFilters((p) => ({ ...p, priceRange: v }))
									}
								>
									<Picker.Item label="All Prices" value="" />
									<Picker.Item label="€1 - €20" value="1-20" />
									<Picker.Item label="€21 - €50" value="21-50" />
									<Picker.Item label="€51 - €100" value="51-100" />
									<Picker.Item label="€101 - €200" value="101-200" />
									<Picker.Item label="€201+" value="201-10000" />
								</Picker>
							</View>

							{/* Apply Filters Button */}
							<TouchableOpacity
								style={styles.button}
								onPress={() => {
									setFilterOpen(false);
									setPage(1);
									fetchProducts(1, true); // replace products with new filter results
								}}
							>
								<Text style={styles.buttonText}>{t("applyFilter")}</Text>
							</TouchableOpacity>
						</ScrollView>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFFFFF" },
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
	categoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	backButton: { marginRight: 6, padding: 4 },
	categoryBar: { flex: 1 },
	categoryBtn: {
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: 20,
		marginRight: 10,
	},
	categoryText: { fontSize: 14, fontWeight: "500", color: "#000000" },
	grid: { padding: 10 },
	card: {
		width: ITEM_WIDTH,
		margin: 4, // smaller margin for 3 items per row
		backgroundColor: "#FFFFFF",
		padding: 8,
	},

	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
	},
	image: { width: "100%", height: "100%" },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "transparent",
		zIndex: 100,
		paddingTop: 60,
	},

	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#FFC300",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
	name: { fontSize: 13, fontWeight: "500", marginBottom: 4, color: "#000000" },
	priceRow: { flexDirection: "row", alignItems: "center" },
	oldPrice: {
		textDecorationLine: "line-through",
		color: "#000000",
		marginRight: 6,
		fontSize: 13,
	},
	newPrice: { fontSize: 15, fontWeight: "700", color: "#000000" },
	basePrice: {
		textDecorationLine: "line-through",
		color: "#000000",
		marginRight: 6,
		fontSize: 13,
	},
	finalPrice: { fontSize: 15, fontWeight: "700", color: "#000000" },
	pagination: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
		backgroundColor: "#FFFFFF",
	},
	arrowButton: { padding: 6 },

	// Tabs
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
	},
	arrowButton: { padding: 6 },

	// Tabs
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
	},
	tabButton: { alignItems: "center", justifyContent: "center" },
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "red",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
	closeBtn: {
		position: "absolute",
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 200,
	},

	// Overlay contents
	overlayContentProfile: {
		paddingTop: 100,
		paddingHorizontal: 20,
		alignItems: "flex-start",
	},
	overlayContentMenu: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},

	title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#000" },

	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
	},
	tabButton: { alignItems: "center", justifyContent: "center" },
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "red",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,1)",
		zIndex: 100,
		paddingTop: 50,
	},
	closeBtn: {
		position: "absolute",
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 200,
	},
	overlayContentProfile: {
		paddingTop: 100,
		paddingHorizontal: 20,
		alignItems: "flex-start",
	},
	overlayContentMenu: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	item: { fontSize: 16, marginVertical: 10, color: "#000" },
	row: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
	title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
	button: {
		backgroundColor: "#ffc300",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginTop: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontWeight: "bold",
		fontSize: 16,
	},
	checkboxRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		marginTop: 10,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: "#000",
	},
	checkboxActive: {
		backgroundColor: "#ffc300",
		borderColor: "#ffc300",
	},
	qtyRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 6,
	},

	qtyContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	qtyBtn: {
		backgroundColor: "#ffc300",
		borderRadius: 4,
		paddingHorizontal: 6,
		paddingVertical: 4,
		marginHorizontal: 4,
	},

	qtyText: { color: "#000", fontSize: 16, fontWeight: "700" },
	qtyValue: { marginHorizontal: 4, fontSize: 14, fontWeight: "700" },

	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
	},

	image: { width: "100%", height: "100%" },

	// ✅ Overlay on product image (transparent dark layer)
	outOfStockOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.55)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},

	outOfStockText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
		textAlign: "center",
	},

	// ✅ Overlay for filter screen (white background)
	filterOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,1)",
		zIndex: 100,
		paddingTop: 50,
	},

	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
});

"use client";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect, useMemo, useState } from "react";
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
	const { t, td } = useTranslation();

	const router = useRouter();
	const searchParams = useLocalSearchParams();

	console.log("Sear ", searchParams);

	// ✅ discount & category from query params
	const discountParam = searchParams.discount ?? "";
	const categoryParam = searchParams.category ?? "";
	const marketParam = searchParams.market ?? "";
	const marketNameParam = searchParams.marketName ?? "";

	const [menuOpen, setMenuOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [user, setUser] = useState(null);
	const [filterOpen, setFilterOpen] = useState(false);
	const [subcategories, setSubcategories] = useState([]);
	// Each market has its own categories/subcategories (the MarketCategory
	// collection), fetched from /api/markets/:id/categories.
	const [marketCats, setMarketCats] = useState([]);
	const [marketCatId, setMarketCatId] = useState("");
	const [marketSubId, setMarketSubId] = useState("");
	const searchParam = searchParams.search ?? "";
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);

	const [filters, setFilters] = useState({
		search: searchParam,
		subcategory: "",
		shelfNumber: "",
		sortBy: "categorySortOrder",
		sortOrder: "asc",
		priceRange: "",
		stockLevel: "",
		discount: false,
		minDiscount: 5,
	});
	// Inside ShopPage component

	const { cart, addToCart, removeFromCart } = useCart();
	const [quantities, setQuantities] = useState({});
	const [showQty, setShowQty] = useState({}); // Track which products show qty

	// Keep the +/- quantity UI in sync with the actual cart (also reflects a
	// cart "restore" when switching markets).
	useEffect(() => {
		const nextQuantities = {};
		const nextShowQty = {};
		cart.forEach((cartItem) => {
			nextQuantities[cartItem._id] = cartItem.quantity || 1;
			nextShowQty[cartItem._id] = true;
		});
		setQuantities(nextQuantities);
		setShowQty(nextShowQty);
	}, [cart]);

	const increaseQty = (product) => {
		const currentQty = quantities[product._id] || 0;

		// ✅ Do not allow exceeding stock
		if (currentQty >= product.stock) {
			return; // Stop here if qty == stock
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
		fetch("https://frischly-dash-leb.onrender.com/api/categories")
			.then((res) => res.json())
			.then((json) => setCategories(json.data || []))
			.catch((err) => console.error(err));
	}, []);

	useEffect(() => {
		const getSubcategories = async () => {
			try {
				const res = await fetch(
					"https://frischly-dash-leb.onrender.com/api/subcategories"
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

	// Load this market's OWN categories + subcategories. Each market defines its
	// taxonomy in the MarketCategory/MarketSubcategory collections. We must NOT
	// derive these from product tags: some markets tag products with main-store
	// categories, which would surface categories the market never created.
	useEffect(() => {
		setMarketCatId("");
		setMarketSubId("");
		if (!marketParam) {
			setMarketCats([]);
			return;
		}
		let cancelled = false;
		fetch(
			`https://frischly-dash-leb.onrender.com/api/markets/${marketParam}/categories`
		)
			.then((res) => res.json())
			.then((json) => {
				if (!cancelled) {
					setMarketCats(Array.isArray(json?.data) ? json.data : []);
				}
			})
			.catch(() => {
				if (!cancelled) setMarketCats([]);
			});
		return () => {
			cancelled = true;
		};
	}, [marketParam]);

	// The currently selected market category (with its subcategories).
	const selectedMarketCat = useMemo(
		() => marketCats.find((c) => String(c._id) === marketCatId),
		[marketCats, marketCatId]
	);

	// Products shown in the market grid, filtered by the selected category /
	// subcategory. Matching is done on the product's subcategory id against this
	// market's own subcategory ids, so only the market's taxonomy is used.
	const displayedProducts = useMemo(() => {
		if (!marketParam) return products;
		if (marketSubId) {
			return products.filter(
				(p) => String(p?.subcategory?._id) === marketSubId
			);
		}
		if (marketCatId) {
			const subIds = new Set(
				(selectedMarketCat?.subcategories || []).map((s) => String(s._id))
			);
			return products.filter((p) => subIds.has(String(p?.subcategory?._id)));
		}
		return products;
	}, [products, marketParam, marketCatId, marketSubId, selectedMarketCat]);

	const fetchProducts = async (nextPage = 1, replace = false) => {
		try {
			if (nextPage === 1) setLoading(true);
			else setIsFetchingMore(true);

			const params = new URLSearchParams();
			params.append("page", nextPage);
			// Markets are small: load all their products in one call so the
			// category chips and client-side filtering have the full list.
			params.append("limit", marketParam ? 200 : 12);

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

			// Main-store browsing filters by the URL category server-side. The
			// market view filters by category client-side (see displayedProducts),
			// so here we just fetch the market's full product list.
			if (!marketParam && categoryParam) params.append("category", categoryParam);

			// include market filter (mobile: filter products by a specific market)
			if (marketParam) {
				params.append("market", marketParam);
			} else {
				// No specific market selected: show main-store items only. Market
				// products are browsed by tapping a market on the home page.
				params.append("market", "none");
			}

let url;

// ✅ If discount from URL OR filter toggle
if (discountParam === "true" || filters.discount === true) {
  params.append("minDiscount", filters.minDiscount || 1);

  url = `https://frischly-dash-leb.onrender.com/api/products/discount?${params.toString()}`;
} else {
  url = `https://frischly-dash-leb.onrender.com/api/products?${params.toString()}`;
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
			// Markets load everything at once, so disable infinite scroll there.
			setHasNextPage(
				marketParam ? false : json.pagination?.hasNextPage ?? false
			);
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
	}, [categoryParam, discountParam, marketParam]);

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
						"https://frischly-dash-leb.onrender.com/api/auth/me",
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
						{td(item.name)}
					</Text>

					{basePrice !== finalPrice ? (
						<View style={styles.priceRow}>
							<Text style={styles.basePrice}>${basePrice.toFixed(2)}</Text>
							<Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>
						</View>
					) : (
						<View style={styles.priceRow}>
							<Text style={styles.newPrice}>${finalPrice.toFixed(2)}</Text>
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
				<ActivityIndicator size="large" color="#f4bb26" />
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

					{marketParam ? (
						marketCats.length > 0 ? (
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
										!marketCatId && { backgroundColor: "#f4bb26" },
									]}
									onPress={() => {
										setMarketCatId("");
										setMarketSubId("");
									}}
								>
									<Text
										style={[
											styles.categoryText,
											!marketCatId && { color: "#000", fontWeight: "700" },
										]}
									>
										{t("all")}
									</Text>
								</TouchableOpacity>

								{/* This market's own categories */}
								{marketCats.map((cat) => {
									const isSelected = marketCatId === String(cat._id);
									return (
										<TouchableOpacity
											key={cat._id}
											style={[
												styles.categoryBtn,
												isSelected && { backgroundColor: "#f4bb26" },
											]}
											onPress={() => {
												setMarketCatId(String(cat._id));
												setMarketSubId("");
											}}
										>
											<Text
												style={[
													styles.categoryText,
													isSelected && { color: "#000", fontWeight: "700" },
												]}
											>
												{td(cat.name)}
											</Text>
										</TouchableOpacity>
									);
								})}
							</ScrollView>
						) : (
							<View style={{ flex: 1, paddingHorizontal: 10 }}>
								<Text
									numberOfLines={1}
									style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
								>
									{marketNameParam || t("market")}
								</Text>
							</View>
						)
					) : discountParam !== "true" && (
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
											backgroundColor: "#f4bb26",
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
											isSelected && { backgroundColor: "#f4bb26" },
										]}
										onPress={() =>
											router.push(
												`/shop1?category=${encodeURIComponent(cat.name)}`
											)
										}
									>
										<Text
											style={[
												styles.categoryText,
												isSelected && { color: "#000", fontWeight: "700" },
											]}
										>
											{td(cat.name)}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					)}

					{discountParam !== "true" && (
						<TouchableOpacity
							style={[styles.categoryBtn, { backgroundColor: "#ddd" }]}
							onPress={() => setFilterOpen(true)}
						>
							<Feather name="sliders" size={18} color="#000" />
						</TouchableOpacity>
					)}
				</View>

				{/* Market subcategory row: the selected category's subcategories */}
				{marketParam &&
					selectedMarketCat &&
					(selectedMarketCat.subcategories || []).length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.subcategoryBar}
							contentContainerStyle={{
								alignItems: "center",
								paddingHorizontal: 8,
								paddingVertical: 8,
							}}
						>
							<TouchableOpacity
								style={[
									styles.subcategoryBtn,
									!marketSubId && styles.subcategoryBtnActive,
								]}
								onPress={() => setMarketSubId("")}
							>
								<Text
									style={[
										styles.subcategoryText,
										!marketSubId && { color: "#000", fontWeight: "700" },
									]}
								>
									{t("all")}
								</Text>
							</TouchableOpacity>

							{(selectedMarketCat.subcategories || []).map((sub) => {
								const isSel = marketSubId === String(sub._id);
								return (
									<TouchableOpacity
										key={sub._id}
										style={[
											styles.subcategoryBtn,
											isSel && styles.subcategoryBtnActive,
										]}
										onPress={() => setMarketSubId(String(sub._id))}
									>
										<Text
											style={[
												styles.subcategoryText,
												isSel && { color: "#000", fontWeight: "700" },
											]}
									>
										{td(sub.name)}
									</Text>
								</TouchableOpacity>
							);
						})}
						</ScrollView>
					)}

				{/* Products Grid */}
				<FlatList
					contentContainerStyle={{ paddingBottom: 120 }}
					data={displayedProducts}
					keyExtractor={(item) => item._id}
					renderItem={renderProduct}
					numColumns={3} // <-- 3 items per row
					onEndReached={marketParam ? undefined : loadMore}
					onEndReachedThreshold={0.3}
					ListEmptyComponent={
						!loading ? (
							<View style={{ paddingVertical: 40, alignItems: "center" }}>
								<Text style={{ color: "#777", fontSize: 14 }}>
									{t("noProductsInCategory")}
								</Text>
							</View>
						) : null
					}
					ListFooterComponent={
						isFetchingMore ? (
							<ActivityIndicator size="small" color="#f4bb26" />
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

							{/* Subcategory Picker (main store only; markets use their own
							   category/subcategory chips above) */}
							{!marketParam && (
								<>
									<Text style={{ marginTop: 20, marginBottom: 5 }}>
										{t("subcategory")}
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
													label={td(sub.name)}
													value={sub.name}
												/>
											))}
										</Picker>
									</View>
								</>
							)}

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
									<Picker.Item label={t("sortPriceLowHigh")} value="price_asc" />
									<Picker.Item label={t("sortPriceHighLow")} value="price_desc" />
									<Picker.Item label={t("sortNameAZ")} value="name_asc" />
									<Picker.Item label={t("sortNameZA")} value="name_desc" />
									<Picker.Item label={t("sortNewest")} value="createdAt_desc" />
									<Picker.Item label={t("sortOldest")} value="createdAt_asc" />
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
									<Picker.Item label={t("allPrices")} value="" />
									<Picker.Item label={t("price1to20")} value="1-20" />
									<Picker.Item label={t("price21to50")} value="21-50" />
									<Picker.Item label={t("price51to100")} value="51-100" />
									<Picker.Item label={t("price101to200")} value="101-200" />
									<Picker.Item label={t("price201plus")} value="201-10000" />
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
	subcategoryBar: {
		backgroundColor: "#fafafa",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	subcategoryBtn: {
		paddingVertical: 5,
		paddingHorizontal: 12,
		borderRadius: 16,
		marginRight: 8,
		backgroundColor: "#eee",
	},
	subcategoryBtnActive: { backgroundColor: "#f4bb26" },
	subcategoryText: { fontSize: 13, fontWeight: "500", color: "#333" },
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
		backgroundColor: "#f4bb26",
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
	finalPrice: { fontSize: 15, fontWeight: "700", color: "red" },
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
		backgroundColor: "#f4bb26",
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
		backgroundColor: "#f4bb26",
		borderColor: "#f4bb26",
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
		backgroundColor: "#f4bb26",
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
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

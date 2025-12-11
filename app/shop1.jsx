"use client";
import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Dimensions,
	FlatList,
	Image,
	ScrollView,
	SectionList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 13; // three items per row with spacing

export default function ShopPage() {
	const router = useRouter();
	const { category } = useLocalSearchParams();
	const { cart, addToCart, removeFromCart } = useCart(); // ✅ Cart context
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const { t } = useTranslation();

	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [sections, setSections] = useState([]);
	const [quantities, setQuantities] = useState({});
	const [showQty, setShowQty] = useState({}); // track which products show qty

	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	// Fetch products by category
	const fetchProducts = async () => {
		try {
			setLoading(true);
			const res = await fetch(
				`https://frischlyshop-server.onrender.com/api/products?limit=200&sortBy=categorySortOrder&sortOrder=asc&category=${encodeURIComponent(
					category
				)}`
			);
			const json = await res.json();
			if (json?.success && json?.data) {
				const grouped = {};
				json.data.forEach((item) => {
					const sub = item?.subcategory?.name || "Other";
					if (!grouped[sub]) grouped[sub] = [];
					grouped[sub].push(item);
				});

				// Create sections data for SectionList with rows
				const sectionsData = Object.keys(grouped).map((subName) => {
					const products = grouped[subName];
					const rows = [];
					for (let i = 0; i < products.length; i += 3) {
						rows.push(products.slice(i, i + 3));
					}
					return {
						title: subName,
						data: rows,
						key: subName
					};
				});
				setSections(sectionsData);
			}
		} catch (err) {
			console.error("fetchProducts error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (category) fetchProducts();
	}, [category]);

	// Check login
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
					}
				} catch (err) {
					console.error("Network/Fetch error:", err);
				}
			}
		};
		checkLogin();
	}, []);

	const increaseQty = (product) => {
		const currentQty = quantities[product._id] || 0;
		// Do not allow increasing beyond stock
		if (currentQty >= product.stock) return;

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

	const renderProduct = (item) => {
		const basePrice = item.price || 0;
		const discountPercent = item.discount || 0;
		const taxPercent = item.tax || 0;
		const bottleRefund = item.bottlerefund || 0;

		const discountAmount = (basePrice * discountPercent) / 100;
		const priceAfterDiscount = basePrice - discountAmount;
		const taxAmount = (priceAfterDiscount * taxPercent) / 100;
		const finalPrice = priceAfterDiscount + taxAmount + bottleRefund;

		const isQtyVisible = showQty[item._id] || false;

		return (
			<TouchableOpacity
				key={item._id}
				onPress={() => router.push(`/product/${item._id}`)}
				activeOpacity={0.8}
			>
				<View style={styles.card}>
					<View style={styles.imageWrapper}>
						<Image
							source={{
								uri: item.picture || "https://via.placeholder.com/150",
							}}
							style={styles.image}
							resizeMode="contain"
						/>
						{item.stock === 0 && (
							<View style={styles.overlay}>
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
					<Text style={styles.finalPrice}>€{finalPrice.toFixed(2)}</Text>

					{/* Add to Cart / Quantity Selector */}
					<View style={styles.qtyRow}>
						{item.stock > 0 ? ( // Only show if stock > 0
							isQtyVisible ? (
								<>
									<TouchableOpacity
										onPress={() => decreaseQty(item)}
										style={styles.qtyBtn}
									>
										<Text style={styles.qtyText}>-</Text>
									</TouchableOpacity>

									<Text style={styles.qtyValue}>
										{quantities[item._id] || 1}
									</Text>

									<TouchableOpacity
										onPress={() => increaseQty(item)}
										style={[
											styles.qtyBtn,
											quantities[item._id] >= item.stock && { opacity: 0.5 }, // visually disable
										]}
										disabled={quantities[item._id] >= item.stock} // actually disable button
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
							)
						) : null}
					</View>
				</View>
			</TouchableOpacity>
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
			{/* Back Button */}
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="chevron-left" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{category}</Text>
			</View>

			{/* Grouped Products with SectionList */}
			<SectionList
				sections={sections}
				keyExtractor={(item, index) => {
					// item is a row (array of products), create key from first product ID and index
					return `row-${item[0]?._id || 'unknown'}-${index}`;
				}}
				renderItem={({ item: row }) => (
					<View style={styles.row}>
						{row.map((product) => renderProduct(product))}
					</View>
				)}
				renderSectionHeader={({ section: { title } }) => (
					<Text style={styles.subcategoryTitle}>{title}</Text>
				)}
				contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 10 }}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
			/>
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
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	backButton: { marginRight: 10 },
	headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
	subcategoryTitle: {
		fontSize: 22,
		fontWeight: "700",
		color: "#000",
		marginHorizontal: 10,
		marginTop: 10,
		marginBottom: 10,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		paddingHorizontal: 10,
	},
	card: {
		width: ITEM_WIDTH,
		padding: 4,
		backgroundColor: "transparent",
		elevation: 0,
		shadowColor: "transparent",
	},
	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
	},
	image: { width: "100%", height: "100%", borderRadius: 0 },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	outOfStockText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#FFC300",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#000", fontSize: 12, fontWeight: "700" },
	name: {
		fontSize: 13,
		fontWeight: "500",
		marginBottom: 4,
		color: "#000000",
		textAlign: "center",
	},
	finalPrice: {
		fontSize: 15,
		fontWeight: "700",
		color: "#000",
		textAlign: "center",
	},
	qtyRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
		justifyContent: "center",
	},
	qtyBtn: {
		backgroundColor: "#FFC300",
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
	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
});

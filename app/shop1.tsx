"use client";
import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService, ProductService } from "@/services/api";
import { styles } from "@/styles/app/shop1.styles";
import type { Product, User } from "@/types";
import { isServedByAdmin } from "@/utils/cityVisibility";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ViewToken } from "react-native";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    SectionList,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 13; // three items per row with spacing

import type { ProductSection } from "@/types/app/shop1.types";

export default function ShopPage() {
	const router = useRouter();
	const { category } = useLocalSearchParams<{ category?: string }>();
	const { cart, addToCart, removeFromCart } = useCart(); // ✅ Cart context
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const { t, td, isRTL } = useTranslation();

	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [sections, setSections] = useState<ProductSection[]>([]);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [showQty, setShowQty] = useState<Record<string, boolean>>({}); // track which products show qty
	const [currentSectionTitle, setCurrentSectionTitle] = useState("");

	// Keep the +/- quantity UI in sync with the actual cart (also reflects a
	// cart "restore" when switching markets).
	useEffect(() => {
		const nextQuantities: Record<string, number> = {};
		const nextShowQty: Record<string, boolean> = {};
		cart.forEach((cartItem) => {
			nextQuantities[cartItem._id] = cartItem.quantity || 1;
			nextShowQty[cartItem._id] = true;
		});
		setQuantities(nextQuantities);
		setShowQty(nextShowQty);
	}, [cart]);

	// Fetch products by category
	const fetchProducts = async () => {
		try {
			setLoading(true);

			// Main-store (admin) items are only shown to users in a city the admin
			// serves AND whose exact map pin falls inside the admin's configured
			// delivery-range circle(s), when set. Guests (no city/pin) and an
			// unconfigured admin still see everything.
			const { city, pin } = await getUserCityAndPin();
			if (!(await isServedByAdmin(city, pin))) {
				setSections([]);
				return;
			}

			const json = await ProductService.list({
				limit: 200,
				sortBy: "price",
				sortOrder: "desc",
				market: "none",
				category: category as string,
			});
			if (json?.success && json?.data) {
				const grouped: Record<string, Product[]> = {};
				json.data.forEach((item) => {
				const sub =
					(typeof item?.subcategory === "object"
						? item.subcategory?.name
						: undefined) || t("other");
					if (!grouped[sub]) grouped[sub] = [];
					grouped[sub].push(item);
				});

				// Create sections data for SectionList with rows
				const sectionsData = Object.keys(grouped).map((subName) => {
					const products = grouped[subName];
					const rows: Product[][] = [];
					for (let i = 0; i < products.length; i += 3) {
						rows.push(products.slice(i, i + 3));
					}
					return {
						title: subName,
						data: rows,
						key: subName,
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
					const res = await AuthService.me();
					if (res?.success) {
						const data = res.data as unknown as { user?: User } | User;
						setUser((data as { user?: User })?.user ?? (data as User));
					}
				} catch (err) {
					console.error("Network/Fetch error:", err);
				}
			}
		};
		checkLogin();
	}, []);

	const increaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;
		// Do not allow increasing beyond stock
		if (currentQty >= product.stock) return;

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

	const onViewableItemsChanged = ({
		viewableItems,
	}: {
		viewableItems: ViewToken[];
	}) => {
		if (viewableItems.length > 0) {
			const firstVisibleItem = viewableItems[0];
			// Find the section that contains this item
			const section = sections.find((sec) =>
				sec.data.some((row) =>
					row.some(
						(product) =>
							`row-${product._id || "unknown"}-${sec.data.indexOf(row)}` ===
							firstVisibleItem.key,
					),
				),
			);
			if (section) {
				setCurrentSectionTitle(section.title);
			}
		}
	};

	const renderProduct = (item: Product) => {
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
						{td(item.name)}
					</Text>
					<Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>

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
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			{/* Back Button */}
			<View style={[styles.header, rtlRow(isRTL)]}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Feather name="chevron-left" size={24} color="#000" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>{td(category)}</Text>
			</View>

			{/* Floating Sticky Header Alternative */}
			{currentSectionTitle ? (
				<View style={styles.floatingHeader}>
					<Text style={styles.floatingHeaderText}>{td(currentSectionTitle)}</Text>
				</View>
			) : null}

			{/* Grouped Products with SectionList */}
			<SectionList
				sections={sections}
				keyExtractor={(item, index) => {
					// item is a row (array of products), create key from first product ID and index
					return `row-${item[0]?._id || "unknown"}-${index}`;
				}}
				renderItem={({ item: row }) => (
					<View style={styles.row}>
						{row.map((product) => renderProduct(product))}
					</View>
				)}
				renderSectionHeader={({ section: { title } }) => (
					<Text style={styles.subcategoryTitle}>{td(title)}</Text>
				)}
				contentContainerStyle={styles.listContentPadding}
				showsVerticalScrollIndicator={false}
				initialNumToRender={10}
				maxToRenderPerBatch={10}
				windowSize={10}
				stickySectionHeadersEnabled={false}
				onViewableItemsChanged={onViewableItemsChanged}
				viewabilityConfig={{
					itemVisiblePercentThreshold: 50,
				}}
				ListEmptyComponent={
					<Text style={styles.emptyText}>{t("noProductsInCategory")}</Text>
				}
			/>
		</SafeAreaView>
	);
}

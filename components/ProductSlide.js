import { useCart } from "@/contexts/CartContext";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useTranslation } from "@/contexts/TranslationContext";
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

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 12; // Show exactly 3 per row
const ITEM_HEIGHT = 180;

export default function DiscountCarousel({ refreshTrigger }) {
	const { t } = useTranslation();
	const router = useRouter();
	const [discountedProducts, setDiscountedProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const flatListRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const { addToCart, removeFromCart, cart } = useCart();
	const [quantities, setQuantities] = useState({});
	const [showQty, setShowQty] = useState({}); // Track which products show qty

	const fetchDiscountProducts = async () => {
		try {
			setLoading(true);
			const res = await fetch(
				"https://frischlyshop-server.onrender.com/api/products/discount"
			);
			const json = await res.json();
			const withDiscount = json.data;
			setDiscountedProducts(withDiscount.slice(0, 12));
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchDiscountProducts();
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) {
			fetchDiscountProducts();
		}
	}, [refreshTrigger]);

const increaseQty = (product) => {
  const currentQty = quantities[product._id] || 0;

  // ✅ Check stock before increase
  if (currentQty >= product.stock) {
    return; // Do nothing if max stock reached
  }

  const newQty = currentQty + 1;
  setQuantities({ ...quantities, [product._id]: newQty });

  addToCart(product, newQty);
  setShowQty({ ...showQty, [product._id]: true });
};


	const decreaseQty = (product) => {
		const currentQty = quantities[product._id] || 0;
		if (currentQty <= 1) {
			// Remove from cart and hide qty
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

	if (loading) {
		return (
			<View
				style={{
					height: ITEM_HEIGHT,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="large" color="#ffc300" />
				<Text>Loading  ...</Text>
			</View>
		);
	}

	const renderProduct = (product) => {
const basePrice = product.price || 0;
const discountPercent = product.discount || 0;

const finalPrice =
	discountPercent > 0
		? basePrice - (basePrice * discountPercent) / 100
		: basePrice;

// const finalPrice = basePrice;


		const isQtyVisible = showQty[product._id] || false;

		return (
			<TouchableOpacity
				key={product._id}
				onPress={() => router.push(`/product/${product._id}`)}
				activeOpacity={0.8}
				style={styles.card}
			>
				<View style={styles.imageWrapper}>
					<Image
						source={{
							uri: product.picture || "https://via.placeholder.com/150",
						}}
						style={styles.image}
						resizeMode="contain"
					/>
					{product.stock === 0 && (
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

				<Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
					{product.name}
				</Text>
 
<View style={styles.priceRow}>
  <Text style={styles.basePrice}>€{basePrice.toFixed(2)}</Text>
  <Text style={styles.finalPrice}>€{finalPrice.toFixed(2)}</Text>
</View>


{/* Quantity Selector or Add to Cart (Hidden if Out of Stock) */}
{product.stock > 0 && (
  <View style={styles.qtyRow}>
    {isQtyVisible ? (
      <>
        <TouchableOpacity onPress={() => decreaseQty(product)} style={styles.qtyBtn}>
          <Text style={styles.qtyText}>-</Text>
        </TouchableOpacity>
<Text style={styles.qtyValue}>{quantities[product._id]}</Text>

<TouchableOpacity
  onPress={() => increaseQty(product)}
  style={[
    styles.qtyBtn,
    quantities[product._id] >= product.stock && { opacity: 0.3 }, // visual disabled
  ]}
  disabled={quantities[product._id] >= product.stock} // ✅ disables the button
>
  <Text style={styles.qtyText}>+</Text>
</TouchableOpacity>

      </>
    ) : (
      <TouchableOpacity
        onPress={() => increaseQty(product)}
        style={[styles.qtyBtn, { paddingHorizontal: 12, paddingVertical: 6 }]}
      >
        <Feather name="shopping-cart" size={20} color="#fff" />
      </TouchableOpacity>
    )}
  </View>
)}

			</TouchableOpacity>
		);
	};

	return (
		<View style={{ height: ITEM_HEIGHT + 80, backgroundColor: "#FFFFFF" }}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{t("hotSale")}</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push("/shop?discount=true")}
					>
						<Text style={styles.allText}>{t("all")}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push("/shop?discount=true")}>
						<Feather name="chevron-right" size={24} color="#000000" />
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				ref={flatListRef}
				data={discountedProducts}
				horizontal
				showsHorizontalScrollIndicator={false}
				keyExtractor={(item) => item._id}
				renderItem={({ item }) => renderProduct(item)}
				onScroll={(e) => {
					const index = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
					setCurrentIndex(index);
				}}
				scrollEventThrottle={16}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 4,
		backgroundColor: "#FFFFFF",
		padding: 8,
		height: 200,
		overflow: "hidden",
		borderRadius: 8,
	},
	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 100,
		marginBottom: 6,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
	},
	image: { width: "100%", height: "100%" },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	outOfStockText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
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
	name: { fontSize: 14, fontWeight: "400", marginBottom: 4, color: "#777" },
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 5,
		paddingHorizontal: 12,
		paddingVertical: 5,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000000" },
	headerRight: { flexDirection: "row", alignItems: "center" },
	allButton: {
		marginRight: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	allText: { fontSize: 18, fontWeight: "500", color: "#777" },
	priceRow: { marginTop: 4 },
	newPrice: { fontSize: 13, fontWeight: "500", color: "#000000" },
	qtyRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 6,
	},
	qtyBtn: {
		backgroundColor: "#ffc300",
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
		marginHorizontal: 4,
	},
	qtyText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fff",
	},
	qtyValue: {
		marginHorizontal: 6,
		fontSize: 14,
		fontWeight: "500",
		color: "#000",
	},
	priceRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10, // or marginRight on basePrice
},

basePrice: {
  color: "#b3b3b3ff",
  textDecorationLine: "line-through",
  fontSize: 13,
},

finalPrice: {
  color: "#000",
  fontWeight: "bold",
  fontSize: 13,
},

});

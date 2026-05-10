import { useTranslation } from "@/contexts/TranslationContext";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * @typedef {Object} Size
 * @property {string} size
 * @property {number} qty
 * @property {number} price
 */

/**
 * @typedef {Object} Color
 * @property {Size[]=} sizes
 */

/**
 * @typedef {Object} TempProps
 * @property {string} _id
 * @property {string} title
 * @property {number} price
 * @property {number} discount
 * @property {string[]} img
 * @property {string} stock
 * @property {'single'|'collection'} type
 * @property {Color[]} color
 */

/**
 * @typedef {Object} CarCardProps
 * @property {TempProps} temp
 * @property {number} index
 */

const CarCard = ({ temp, index }) => {
	const navigation = useNavigation();
	const { _id, title, discount, img, stock, type, color } = temp;
	const router = useRouter();
	const { t } = useTranslation();

	// Rotate 3 background colors
	const bgColors = ["#f4bb26", "#000000", "#FFFFFF"]; // yellow, black, white
	const selectedBg = bgColors[index % bgColors.length];

	// Determine if product is out of stock
	const isOutOfStock =
		(type === "single" && parseInt(stock) === 0) ||
		(type === "collection" &&
			color?.every((c) =>
				c.sizes?.every((size) => parseInt(size.qty.toString()) === 0)
			));

	// Calculate price range
	const getPriceDisplay = () => {
		if (type === "single" || (type === "collection" && !color)) {
			return `$${discount}`;
		}

		if (type === "collection" && color && color.some((c) => c.sizes?.length)) {
			const prices = color.flatMap((c) => c.sizes || []).map((s) => s.price);
			if (prices.length === 0) return "N/A";
			const minPrice = Math.min(...prices);
			const maxPrice = Math.max(...prices);
			return minPrice === maxPrice
				? `$${minPrice.toFixed(2)}`
				: `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
		}

		return `$${discount}`;
	};

	const getOriginalPrice = () => {
		if (type === "single" || (type === "collection" && !color)) {
			return `$${(discount * 1.25).toFixed(2)}`;
		}

		if (type === "collection" && color && color.some((c) => c.sizes?.length)) {
			const prices = color
				.flatMap((c) => c.sizes || [])
				.map((s) => s.price * 1.25);
			if (prices.length === 0) return "N/A";
			const minPrice = Math.min(...prices);
			const maxPrice = Math.max(...prices);
			return minPrice === maxPrice
				? `$${minPrice.toFixed(2)}`
				: `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
		}

		return `$${(discount * 1.25).toFixed(2)}`;
	};

	const getSizesDisplay = () => {
		const sizes = Array.from(
			new Set(color.flatMap((c) => c.sizes?.map((s) => s.size) || []))
		);
		return sizes.length > 0 ? sizes.join(", ") : "N/A";
	};

	const handlePress = () => {
		router.push(`/product/${temp._id}`);
	};

	return (
		<TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
			{/* Image Section */}
			<View style={styles.imageWrapper}>
				<Image
					source={{
						uri: img[0],
					}}
					style={styles.productImage}
					resizeMode="contain"
				/>

				{/* Discount Badge */}
				<View style={styles.discountBadge}>
					<Text style={styles.discountText}>-25%</Text>
				</View>

				{/* Out of Stock Overlay */}
				{isOutOfStock && (
					<View style={styles.outOfStockOverlay}>
						<Text style={styles.outOfStockText}>{t("out")}</Text>
					</View>
				)}
			</View>

			{/* Title Section */}
			<View style={[styles.titleContainer, { backgroundColor: selectedBg }]}>
				<Text style={styles.titleText} numberOfLines={1}>
					{title}
				</Text>
			</View>

			{/* Sizes */}
			<Text style={styles.sizesText}>{getSizesDisplay()}</Text>

			{/* Price Section */}
			<View style={styles.priceContainer}>
				<Text style={styles.priceText}>{getPriceDisplay()}</Text>
				<Text style={styles.originalPriceText}>{getOriginalPrice()}</Text>
			</View>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	cardContainer: {
		backgroundColor: "#FFFFFF",
		borderRadius: 8,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "#000000",
		shadowColor: "#000000",
		shadowOpacity: 0.1,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 5,
		elevation: 3,
		height: 400,
		flexDirection: "column",
	},
	imageWrapper: {
		height: 250,
		backgroundColor: "#FFFFFF",
		position: "relative",
	},
	productImage: {
		width: "100%",
		height: "100%",
	},
	discountBadge: {
		position: "absolute",
		bottom: 8,
		right: 8,
		backgroundColor: "#f4bb26",
		paddingVertical: 4,
		paddingHorizontal: 6,
		borderRadius: 4,
	},
	discountText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 12,
	},
	outOfStockOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "#000000",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},
	outOfStockText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 18,
	},
	titleContainer: {
		paddingVertical: 8,
		paddingHorizontal: 12,
	},
	titleText: {
		color: "#FFFFFF",
		fontWeight: "bold",
		fontSize: 16,
	},
	sizesText: {
		paddingHorizontal: 12,
		paddingVertical: 4,
		backgroundColor: "#f4bb26",
		fontWeight: "bold",
		fontSize: 16,
		color: "#000000",
	},
	priceContainer: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		backgroundColor: "#f4bb26",
	},
	priceText: {
		fontWeight: "bold",
		fontSize: 16,
		color: "#000000",
	},
	originalPriceText: {
		fontSize: 14,
		textDecorationLine: "line-through",
		color: "#000000",
		marginTop: 4,
	},
});

export default CarCard;

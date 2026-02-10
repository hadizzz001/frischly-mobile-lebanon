import Cart from "@/components/Cart";
import OutOfStockComponent from "@/components/OutOfStockComponent";
import QuantitySelector from "@/components/QuantitySelector";
import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Modal, StyleSheet, Text, View } from "react-native";

import { Dimensions, ScrollView, TouchableOpacity } from "react-native";
import Swiper from "react-native-swiper";
import Feather from "react-native-vector-icons/Feather";

const { width } = Dimensions.get("window");

const ProductPage = () => {
	const { t } = useTranslation();

	const route = useRoute();
	const navigation = useNavigation();
	const { id: search } = route.params || {};
	const [menuOpen, setMenuOpen] = useState(false);
	const [product, setProduct] = useState(null);
	const [quantity, setQuantity] = useState(1);
	const [zoomedImg, setZoomedImg] = useState(null);
	const { cart, addToCart } = useCart();
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const router = useRouter();
	const isInCart = cart?.some((item) => item._id === search);
	const [profileOpen, setProfileOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	const [user, setUser] = useState(null);
	const [showModal, setShowModal] = useState(false);
const [showAgeModal, setShowAgeModal] = useState(false);



	const token = process.env.EXPO_PUBLIC_JWT_TOKEN;

	// Fetch product
	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(
					`https://frischlyshop-server.onrender.com/api/products/${search}`
				);
				const json = await res.json();
				if (json?.success && json?.data) setProduct(json.data);
			} catch (err) {
				console.error("Fetch error:", err);
			}
		};
		fetchData();
	}, [search]);

	// Fetch categories
	useEffect(() => {
		fetch("https://frischlyshop-server.onrender.com/api/categories")
			.then((res) => res.json())
			.then((json) => setCategories(json.data || []))
			.catch((err) => console.error(err));
	}, []);

	// Fetch user info (if logged in)
	useEffect(() => {
		const checkLogin = async () => {
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
				console.error(err);
			}
		};
		checkLogin();
	}, []);

	const handleAddToCart = () => {
		addToCart(product, quantity);
	};

	const toggleCart = () => setBooleanValue(!isBooleanValue);

	if (!product) return <Text style={styles.center}>Loading...</Text>;

	const {
		_id,
		name,
		description,
		price,
		discount,
		stock,
		stockStatus,
		picture,
		subcategory,
		parentCategory,
		dimensions,
		weight,
		tax,
		bottlerefund,
	} = product;

	const isOutOfStock = stock === 0;


	const handleGoToCheckout = () => {
	const has18PlusItem = cart.some(
		(item) => item?.is18Plus === true
	);

	if (has18PlusItem) {
		setShowAgeModal(true);
		return;
	}

	router.push("/checkout");
};

const handleAgeResponse = (response) => {
	setShowAgeModal(false);

	if (response === "yes") {
		router.push("/checkout");
	}
};



	return (
		<View style={{ flex: 1, backgroundColor: "#fff" }}>
			<Stack.Screen options={{ headerTitle: "" }} />
			<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
				<Feather name="chevron-left" size={24} color="#777" />
			</TouchableOpacity>

			<ScrollView style={styles.container}>
				{/* Zoom Modal */}
				<Modal
					visible={!!zoomedImg}
					transparent
					animationType="fade"
					onRequestClose={() => setZoomedImg(null)}
				>
					<TouchableOpacity
						style={styles.zoomOverlay}
						activeOpacity={1}
						onPress={() => setZoomedImg(null)}
					>
						<TouchableOpacity
							activeOpacity={1}
							onPress={(e) => e.stopPropagation()}
							style={styles.zoomContainer}
						>
							<Image
								source={{ uri: zoomedImg }}
								style={styles.zoomImage}
								resizeMode="contain"
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				</Modal>

				{/* Image Swiper */}
				<Swiper
					style={styles.swiper}
					showsPagination
					loop
					dotStyle={styles.dot}
					activeDotStyle={styles.activeDot}
				>
					{[picture].map((src, i) => (
						<View key={i} style={styles.slide}>
							<TouchableOpacity onPress={() => setZoomedImg(src)}>
								<Image
									source={{ uri: src }}
									style={styles.swiperImage}
									resizeMode="contain"
								/>
							</TouchableOpacity>
						</View>
					))}
				</Swiper>

				{/* Product Info */}
				<View style={styles.info}>
					<Text style={styles.title}>{name}</Text>

					<Text>{description}</Text>

					{/* Price Calculation */}
					{(() => {
						const basePrice = parseFloat(price) || 0;
						const discountPercent = parseFloat(discount) || 0;
						const taxPercent = parseFloat(tax) || 0;
						const bottleRefundValue = parseFloat(bottlerefund) || 0;

						// Discount calculation
						const discountAmount = (basePrice * discountPercent) / 100;
						const discountedPrice = basePrice - discountAmount;

						// Tax as percentage of discounted price
						const taxAmount = (discountedPrice * taxPercent) / 100;

						// Final Price
						const finalPrice = discountedPrice + taxAmount + bottleRefundValue;

						return (
							<View style={styles.priceDetails}>
								<Text style={styles.basePrice}>
									{t("baseP")}: €{basePrice.toFixed(2)}
								</Text>
								{discountPercent > 0 && (
									<Text style={styles.discount}>
										{t("discount")} ({discountPercent}%): -€
										{discountAmount.toFixed(2)}
									</Text>
								)}
								{taxPercent > 0 && (
									<Text style={styles.tax}>
										{t("tax")} ({taxPercent}%): +€{taxAmount.toFixed(2)}
									</Text>
								)}
								{bottleRefundValue > 0 && (
									<Text style={styles.bottleRefund}>
										{t("bottle")}: +€{bottleRefundValue.toFixed(2)}
									</Text>
								)}
								   <Text
									   style={[
										   styles.finalPrice,
										   discountPercent > 0 && { color: 'red' }
									   ]}
								   >
									   {t("fPrice")}: €{finalPrice.toFixed(2)}
								   </Text>
							</View>
						);
					})()}

					{/* Add to Cart / Checkout */}
					{isInCart ? (
						<TouchableOpacity
							onPress={handleGoToCheckout}

							style={styles.button}
						>
							<Text style={styles.buttonText}>{t("goToCheckout")}</Text>
						</TouchableOpacity>
					) : (
						<>
							<QuantitySelector
								initialQty={quantity}
								onChange={setQuantity}
								productId={_id}
							/>
							{!isOutOfStock ? (
								<TouchableOpacity
									onPress={handleAddToCart}
									style={styles.button}
								>
									<Text style={styles.buttonText}>{t("aBag")}</Text>
								</TouchableOpacity>
							) : (
								<OutOfStockComponent itemName={name} />
							)}
						</>
					)}
				</View>
			</ScrollView>

			{/* Bottom Tab Bar */}
			{/* <View style={styles.tabBar}>
				<TouchableOpacity
					style={styles.tabButton}
					onPress={() => router.push("/")}
				>
					<Feather name="home" size={24} color="#FFC300" />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.tabButton}
					onPress={() => setMenuOpen(true)}
				>
					<Feather name="menu" size={24} color="#FFC300" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.tabButton} onPress={toggleCart}>
					<Feather name="shopping-cart" size={24} color="#FFC300" />
					{cart?.length > 0 && <View style={styles.cartBadge} />}
				</TouchableOpacity>
								<TouchableOpacity
					style={styles.tabButton}
					onPress={() => setProfileOpen(true)}
				>
					<Feather name="user" size={24} color="#FFC300" />
				</TouchableOpacity>
			</View> */}

			{/* Profile Overlay */}
			{profileOpen && (
				<View style={styles.overlay}>
					<TouchableOpacity
						style={styles.closeBtn}
						onPress={() => setProfileOpen(false)}
					>
						<Feather name="x" size={28} color="#000" />
					</TouchableOpacity>
					<ScrollView contentContainerStyle={styles.overlayContentProfile}>
						<Text style={styles.title}>{t("myProfile")}</Text>
						{user ? (
							<>
								<Text style={styles.item}>Name: {user.name}</Text>
								<Text style={styles.item}>Email: {user.email}</Text>
								<Text style={styles.item}>Phone: {user.phoneNumber}</Text>
							</>
						) : (
							<Text style={styles.item}>{t("loadingUser")}</Text>
						)}
						<TouchableOpacity
							style={styles.row}
							onPress={async () => {
								await AsyncStorage.removeItem("userData");
								await AsyncStorage.setItem("guest", "false");
								setProfileOpen(false);
								router.replace("/start");
							}}
						>
							<Feather
								name="log-out"
								size={20}
								color="red"
								style={{ marginRight: 6 }}
							/>
							<Text style={[styles.item, { color: "red" }]}>{t("logout")}</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={styles.row}
							onPress={async () => {
								await AsyncStorage.removeItem("userData");
								await AsyncStorage.setItem("guest", "false");
								setProfileOpen(false);
								router.replace("/start");
							}}
						>
							<Feather
								name="trash-2"
								size={20}
								color="red"
								style={{ marginRight: 6 }}
							/>
							<Text style={[styles.item, { color: "red" }]}>
								{t("requestDeleteAccount")}
							</Text>
						</TouchableOpacity>
					</ScrollView>
				</View>
			)}

			{/* Menu Overlay */}
			{menuOpen && (
				<View style={styles.overlay}>
					<TouchableOpacity
						style={styles.closeBtn}
						onPress={() => setMenuOpen(false)}
					>
						<Feather name="x" size={28} color="#000" />
					</TouchableOpacity>
					<ScrollView contentContainerStyle={styles.overlayContentMenu}>
						<Text style={styles.title}>{t("categories")}</Text>
						{categories.slice(0, 8).map((cat) => (
							<TouchableOpacity
								key={cat._id}
								onPress={() => {
									setMenuOpen(false);
									router.push(`/shop?category=${cat._id}`);
								}}
							>
								<Text style={styles.item}>{cat.name}</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							onPress={() => {
								setMenuOpen(false);
								router.push("/shop");
							}}
						>
							<Text style={styles.item}>{t("allCategories")}</Text>
						</TouchableOpacity>
					</ScrollView>
				</View>
			)}

			{/* Cart Overlay */}
			{isBooleanValue && (
				<View style={styles.overlay}>
					{/* <TouchableOpacity
						style={styles.closeBtn}
						onPress={() => setBooleanValue(false)}
					>
						<Feather name="x" size={28} color="#000" />
					</TouchableOpacity> */}
					<Cart />
				</View>
			)}

			<Modal visible={showAgeModal} transparent animationType="slide">
	<View style={styles.modalBackground}>
		<View style={styles.modalContainer}>
			<Text
				style={{
					marginBottom: 20,
					textAlign: "center",
					fontWeight: "bold",
				}}
			>
				{t("ageVerificationTitle")}
			</Text>

			<Text style={{ marginBottom: 30, textAlign: "center" }}>
				{t("ageVerification")}
			</Text>

			<View style={{ width: "100%" }}>
				{/* YES */}
				<TouchableOpacity
					onPress={() => handleAgeResponse("yes")}
					style={{
						backgroundColor: "#ffc300",
						paddingVertical: 16,
						borderRadius: 8,
						marginBottom: 15,
						width: "100%",
					}}
				>
					<Text
						style={{
							color: "black",
							textAlign: "center",
							fontWeight: "bold",
							fontSize: 18,
						}}
					>
						{t("yes")}
					</Text>
				</TouchableOpacity>

				{/* NO */}
				<TouchableOpacity
					onPress={() => handleAgeResponse("no")}
					style={{
						paddingVertical: 16,
						borderRadius: 8,
						width: "100%",
					}}
				>
					<Text
						style={{
							color: "#ffc300",
							textAlign: "center",
							fontWeight: "bold",
							fontSize: 18,
						}}
					>
						{t("no")}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	</View>
</Modal>

		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	swiper: { height: 300 },
	slide: { flex: 1, justifyContent: "center", alignItems: "center" },
	swiperImage: { width: width - 40, height: 250, borderRadius: 8 },
	info: { padding: 16 },
	title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
	button: {
		backgroundColor: "#000",
		padding: 12,
		borderRadius: 6,
		marginTop: 8,
	},
	buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
	dot: {
		backgroundColor: "rgba(0,0,0,0.2)",
		width: 8,
		height: 8,
		borderRadius: 4,
		margin: 3,
	},
	activeDot: {
		backgroundColor: "#000",
		width: 10,
		height: 10,
		borderRadius: 5,
		margin: 3,
	},
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255 )",
		zIndex: 100,
		paddingTop: 50,
	},
	imageWrapper: { maxWidth: "90%", maxHeight: "90%" },
	zoomImage: {
		width: width * 0.9,
		height: width * 0.9,
		borderRadius: 10,
		resizeMode: "contain",
	},
	backButton: { marginRight: 6, padding: 4, backgroundColor: "#fff" },

	// Tab Bar
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#fff",
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
	item: { fontSize: 16, marginVertical: 10, color: "#000" },
	row: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
	finalPrice: {
		fontSize: 18,
		fontWeight: "bold",
		marginTop: 8,
		marginBottom: 8,
	},

	zoomOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.8)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 100,
	},
	zoomContainer: {
		maxWidth: "100%",
		maxHeight: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	zoomImage: {
		width: width * 1.2,
		height: width * 1.2,
	},
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		width: "80%",
	},
});

export default ProductPage;

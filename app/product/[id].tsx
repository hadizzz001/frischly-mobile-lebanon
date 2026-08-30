import Cart from "@/components/Cart";
import OutOfStockComponent from "@/components/OutOfStockComponent";
import QuantitySelector from "@/components/QuantitySelector";
import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { AuthService, CategoryService, ProductService } from "@/services/api";
import type { Category, Product, User } from "@/types";
import { rtlText } from "@/utils/rtl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Modal, Text, View } from "react-native";

import { styles } from "@/styles/app/product/[id].styles";
import { formatWeight } from "@/utils/product";
import { ScrollView, TouchableOpacity } from "react-native";
import Swiper from "react-native-swiper";
import Feather from "react-native-vector-icons/Feather";

export default function ProductPage() {
	const { t, td, isRTL } = useTranslation();

	const route = useRoute();
	const navigation = useNavigation();
	const { id: search } = (route.params as { id?: string }) || {};
	const [menuOpen, setMenuOpen] = useState(false);
	const [product, setProduct] = useState<Product | null>(null);
	const [quantity, setQuantity] = useState(1);
	const [zoomedImg, setZoomedImg] = useState<string | null>(null);
	const { cart, addToCart } = useCart();
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const router = useRouter();
	const isInCart = cart?.some((item) => item._id === search);
	const [profileOpen, setProfileOpen] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [user, setUser] = useState<User | null>(null);
	const [showModal, setShowModal] = useState(false);
const [showAgeModal, setShowAgeModal] = useState(false);



	// Fetch product
	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await ProductService.getById(search as string);
				if (res?.success && res?.data) {
					setProduct(res.data);
				}
			} catch (err) {
				console.error("Fetch error:", err);
			}
		};
		fetchData();
	}, [search]);

	// Fetch categories
	useEffect(() => {
		CategoryService.list()
			.then((res) => setCategories(res.data || []))
			.catch((err) => console.error(err));
	}, []);

	// Fetch user info (if logged in)
	useEffect(() => {
		const checkLogin = async () => {
			try {
				const res = await AuthService.me();
				const data = res.data as unknown as { user?: User } | User;
				setUser((data as { user?: User })?.user ?? (data as User));
			} catch (err) {
				console.error(err);
			}
		};
		checkLogin();
	}, []);

	const handleAddToCart = () => {
		if (product) addToCart(product, quantity);
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

const handleAgeResponse = (response: "yes" | "no") => {
	setShowAgeModal(false);

	if (response === "yes") {
		router.push("/checkout");
	}
};



	return (
		<View style={styles.root}>
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
								source={{ uri: zoomedImg || undefined }}
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
							<TouchableOpacity onPress={() => setZoomedImg(src ?? null)}>
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
					<Text style={[styles.title, rtlText(isRTL)]}>{td(name)}</Text>

					{!!formatWeight(weight) && (
						<Text style={[styles.weight, rtlText(isRTL)]}>
							{formatWeight(weight)}
						</Text>
					)}

					<Text style={rtlText(isRTL)}>{description}</Text>

					{/* Price Calculation */}
					{(() => {
						const basePrice = parseFloat(String(price)) || 0;
						const discountPercent = parseFloat(String(discount)) || 0;
						const taxPercent = parseFloat(String(tax)) || 0;
						const bottleRefundValue = parseFloat(String(bottlerefund)) || 0;

						// Discount calculation
						const discountAmount = (basePrice * discountPercent) / 100;
						const discountedPrice = basePrice - discountAmount;

						// Tax as percentage of discounted price
						const taxAmount = (discountedPrice * taxPercent) / 100;

						// Final Price
						const finalPrice = discountedPrice + taxAmount + bottleRefundValue;

						return (
							<View style={styles.priceDetails}>
								<Text style={[styles.basePrice, rtlText(isRTL)]}>
									{t("baseP")}: ${basePrice.toFixed(2)}
								</Text>
								{discountPercent > 0 && (
									<Text style={[styles.discount, rtlText(isRTL)]}>
										{t("discount")} ({discountPercent}%): -$
										{discountAmount.toFixed(2)}
									</Text>
								)}
								{taxPercent > 0 && (
									<Text style={[styles.tax, rtlText(isRTL)]}>
										{t("tax")} ({taxPercent}%): +${taxAmount.toFixed(2)}
									</Text>
								)}
								{bottleRefundValue > 0 && (
									<Text style={[styles.bottleRefund, rtlText(isRTL)]}>
										{t("bottle")}: +${bottleRefundValue.toFixed(2)}
									</Text>
								)}
								   <Text
									   style={[
										   styles.finalPrice,
										   discountPercent > 0 && styles.redText,
										   rtlText(isRTL),
									   ]}
								   >
									   {t("fPrice")}: ${finalPrice.toFixed(2)}
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
					<Feather name="home" size={24} color="#f4bb26" />
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.tabButton}
					onPress={() => setMenuOpen(true)}
				>
					<Feather name="menu" size={24} color="#f4bb26" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.tabButton} onPress={toggleCart}>
					<Feather name="shopping-cart" size={24} color="#f4bb26" />
					{cart?.length > 0 && <View style={styles.cartBadge} />}
				</TouchableOpacity>
								<TouchableOpacity
					style={styles.tabButton}
					onPress={() => setProfileOpen(true)}
				>
					<Feather name="user" size={24} color="#f4bb26" />
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
						<Text style={[styles.title, rtlText(isRTL)]}>{t("myProfile")}</Text>
						{user ? (
							<>
								<Text style={[styles.item, rtlText(isRTL)]}>{t("fullName")}: {user.name}</Text>
								<Text style={[styles.item, rtlText(isRTL)]}>{t("email")}: {user.email}</Text>
								<Text style={[styles.item, rtlText(isRTL)]}>{t("phoneNumber")}: {user.phoneNumber}</Text>
							</>
						) : (
							<Text style={[styles.item, rtlText(isRTL)]}>{t("loadingUser")}</Text>
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
								style={styles.iconMarginRight}
							/>
							<Text style={[styles.item, styles.redText]}>{t("logout")}</Text>
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
								style={styles.iconMarginRight}
							/>
							<Text style={[styles.item, styles.redText]}>
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
						<Text style={[styles.title, rtlText(isRTL)]}>{t("categories")}</Text>
						{categories.slice(0, 8).map((cat) => (
							<TouchableOpacity
								key={cat._id}
								onPress={() => {
									setMenuOpen(false);
									router.push(`/shop?category=${cat._id}`);
								}}
							>
								<Text style={[styles.item, rtlText(isRTL)]}>{td(cat.name)}</Text>
							</TouchableOpacity>
						))}
						<TouchableOpacity
							onPress={() => {
								setMenuOpen(false);
								router.push("/shop");
							}}
						>
							<Text style={[styles.item, rtlText(isRTL)]}>{t("allCategories")}</Text>
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
				style={styles.ageModalTitle}
			>
				{t("ageVerificationTitle")}
			</Text>

			<Text style={styles.ageModalBody}>
				{t("ageVerification")}
			</Text>

			<View style={styles.fullWidth}>
				{/* YES */}
				<TouchableOpacity
					onPress={() => handleAgeResponse("yes")}
					style={styles.ageYesButton}
				>
					<Text
						style={styles.ageYesButtonText}
					>
						{t("yes")}
					</Text>
				</TouchableOpacity>

				{/* NO */}
				<TouchableOpacity
					onPress={() => handleAgeResponse("no")}
					style={styles.ageNoButton}
				>
					<Text
						style={styles.ageNoButtonText}
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
}

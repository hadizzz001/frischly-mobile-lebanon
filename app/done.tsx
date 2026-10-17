import BackButton from "@/components/ui/BackButton";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { OrderService } from "@/services/api";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	BackHandler,
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { styles } from "@/styles/app/done.styles";

export default function CheckoutSuccessPage() {
	const { t, isRTL } = useTranslation();

	const { clearCart } = useCart();
	const router = useRouter();
	const [loading, setLoading] = useState<boolean>(true);

	const params = useLocalSearchParams<{ yourData: string }>();
	const parsedRaw = JSON.parse(params.yourData);

	// The create order flow historically forwarded the full API envelope
	// (`{ success, message, data: { populatedOrder, paymentUrl } }`) but
	// some callers pass only the inner `data` object. Accept both shapes.
	const parsed = parsedRaw?.data ? parsedRaw.data : parsedRaw;
	const paymentUrl = parsed?.paymentUrl;
	const paymentMethod = parsed?.data?.paymentMethod || parsed?.paymentMethod || "card";

	console.log("Payment URL (resolved):", paymentUrl);
	console.log("Payment Method (resolved):", paymentMethod);


	useEffect(() => {
		const checkLoginAndFetchOrders = async (): Promise<void> => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				if (!userData && !guest) return;

				const parsedUser = userData ? JSON.parse(userData) : null;
				const token = parsedUser?.token;
				if (!token) return;

				// Fetch orders
				try {
					const ordersRes = await OrderService.list();
					const fetchedOrders = ordersRes.data || [];
				} catch {
					console.error("Failed to fetch orders");
				}
			} catch (err) {
				console.error("Error:", err);
			} finally {
				setLoading(false);
			}
		};

		checkLoginAndFetchOrders();
	}, []);

	useEffect(() => {
		clearCart();
	}, []);

	// The order is done: leaving this screen always means going home, never
	// back into the checkout flow. Covers the phone's back button/gesture; the
	// on-screen back arrow and "Back to home" button do the same below.
	const goHome = () => router.replace("/");

	useEffect(() => {
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => {
				router.replace("/");
				return true; // handled — don't pop the stack
			},
		);
		return () => subscription.remove();
	}, [router]);

	if (loading) return <Text>{t("loading")}</Text>;

	console.log("paymentUrl ", paymentUrl);

	return (
		<>
		{/* No swiping back into checkout either. */}
		<Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
		<ScrollView
			style={styles.scrollContainer}
			contentContainerStyle={styles.contentContainer}
		>
			<BackButton onPress={goHome} style={[styles.backButton, isRTL ? styles.backButtonRight : styles.backButtonLeft]} />

			<View style={styles.inner}>
				{/* SVG Icon */}
				<Svg
					width={64}
					height={64}
					viewBox="0 0 24 24"
					fill="none"
					stroke="#000"
				>
					<G strokeWidth={0}></G>
					<G strokeLinecap="round" strokeLinejoin="round"></G>
					<G>
						<Path
							d="M3.74181 20.5545C4.94143 22 7.17414 22 11.6395 22H12.3607C16.8261 22 19.0589 22 20.2585 20.5545M3.74181 20.5545C2.54219 19.1091 2.95365 16.9146 3.77657 12.5257C4.36179 9.40452 4.65441 7.84393 5.7653 6.92196M3.74181 20.5545C3.74181 20.5545 3.74181 20.5545 3.74181 20.5545ZM20.2585 20.5545C21.4581 19.1091 21.0466 16.9146 20.2237 12.5257C19.6385 9.40452 19.3459 7.84393 18.235 6.92196M20.2585 20.5545C20.2585 20.5545 20.2585 20.5545 20.2585 20.5545ZM18.235 6.92196C17.1241 6 15.5363 6 12.3607 6H11.6395C8.46398 6 6.8762 6 5.7653 6.92196M18.235 6.92196C18.235 6.92196 18.235 6.92196 18.235 6.92196ZM5.7653 6.92196C5.7653 6.92196 5.7653 6.92196 5.7653 6.92196Z"
							stroke="#000"
							strokeWidth={1.5}
						/>
						<Path
							d="M9 6V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V6"
							stroke="#000"
							strokeWidth={1.5}
							strokeLinecap="round"
						/>
					</G>
				</Svg>

				{/* Messages */}
				<Text style={styles.title}>{t("thankYouPurchase")}</Text>
				<Text style={styles.subtitle}>
					{paymentMethod === "cash"
						? t("orderProcessedCash")
						: t("orderProcessed")}
				</Text>

				{paymentMethod === "cash" ? (
					<TouchableOpacity
						style={styles.button}
						onPress={goHome}
					>
						<Text style={styles.buttonText}>{t("backToHome")}</Text>
					</TouchableOpacity>
				) : (
					paymentUrl && (
						<TouchableOpacity
							style={styles.button}
							onPress={() => Linking.openURL(`${paymentUrl}`)}
						>
							<Text style={styles.buttonText}>{t("proceedToPayment")}</Text>
						</TouchableOpacity>
					)
				)}
			</View>
		</ScrollView>
		</>
	);
}

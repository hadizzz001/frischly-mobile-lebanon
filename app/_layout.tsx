"use client";

import BottomNav from "@/components/BottomNav";
import FeedbackModal from "@/components/FeedbackModal";
import Header from "@/components/Header";
import VoiceSearchButton from "@/components/VoiceSearchButton";
import { API_BASE_URL } from "@/constants/api";
import { BooleanProvider } from "@/contexts/CartBoolContext";
import { CartProvider } from "@/contexts/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import useDeliveredOrderFeedback from "@/hooks/useDeliveredOrderFeedback";
import useNotifications from "@/hooks/useNotifications";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import "react-native-reanimated";

export default function RootLayout() {
	const pathname = usePathname(); // current route
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	// Set up push notifications (permissions, token registration, tap handling).
	// Order-status notifications are delivered by the server via Expo push, so
	// they arrive even when the app is fully closed/killed — and, thanks to the
	// foreground handler in useNotifications, still show while the app is open.
	useNotifications();

	// ✅ App-wide auto-sync: silently watches the shopper's orders (on an
	// interval + whenever the app returns to the foreground) and pops the
	// feedback modal the moment one becomes "delivered" — from ANY screen,
	// no need to open the Orders page or refresh anything.
	const { feedbackOrderId, closeFeedbackModal } = useDeliveredOrderFeedback();



	// For Lower.js overlays
	const [menuOpen, setMenuOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	// Fetch categories
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch(
					`${API_BASE_URL}/categories`
				);
				const data = await res.json();
				setCategories(data);
			} catch (err) {
				console.error(err);
			}
		};
		fetchCategories();
	}, []);

	if (!loaded) return null;

	// Hide header on login/register page
	const hideHeaderOn = ["/start", "/register", "/checkout"]; // add more paths if needed
	const showHeader = !hideHeaderOn.includes(pathname);

	// Hide the bottom navigation on the pre-login auth screens
	const hideBottomNavOn = ["/start", "/register"];
	const showBottomNav = !hideBottomNavOn.includes(pathname);

	// Don't interrupt the login/register/checkout flows with the feedback
	// prompt — it'll simply show up as soon as the shopper navigates away
	// from one of these screens (the state persists, nothing is lost).
	const suppressFeedbackOn = ["/start", "/register", "/checkout"];
	const showFeedbackModal =
		!!feedbackOrderId && !suppressFeedbackOn.includes(pathname);

	return (
		<TranslationProvider>
		<CartProvider>
			<BooleanProvider>
				<View style={styles.container}>
					{/* Show header conditionally */}
					{showHeader && <Header />}
					{/* Main navigation stack */}
					<Stack
						screenOptions={{
							headerTitle: "",
						}}
					>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />

						{/* Force hide header for auth screens */}
						<Stack.Screen name="start" options={{ headerShown: false }} />
						<Stack.Screen name="register" options={{ headerShown: false }} />
						<Stack.Screen name="shop" options={{ headerShown: false }} />
						<Stack.Screen name="shop1" options={{ headerShown: false }} />
						<Stack.Screen name="checkout" options={{ headerShown: false }} />
						<Stack.Screen name="order" options={{ headerShown: false }} />
						<Stack.Screen
							name="edit-profile"
							options={{ headerShown: false }}
						/>
						<Stack.Screen name="done" options={{ headerShown: false }} />
						<Stack.Screen
							name="product/[id]"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="kitchen/[id]"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="market/[id]"
							options={{ headerShown: false }}
						/>						<Stack.Screen
							name="kitchen-category/[id]"
							options={{ headerShown: false }}
						/>
						<Stack.Screen
							name="track/[id]"
							options={{ headerShown: false }}
						/>

						<Stack.Screen name="+not-found" />
					</Stack>
					{showBottomNav && <BottomNav />}
					{/* Floating hold-to-talk AI voice search (bottom-right) */}
					{showHeader && <VoiceSearchButton floating />}
					{/* ✅ App-wide "rate your order" prompt — auto-shown as soon as an
					    order's status flips to delivered, from any screen. */}
					<FeedbackModal
						visible={showFeedbackModal}
						orderId={feedbackOrderId}
						onClose={closeFeedbackModal}
						onSubmitted={closeFeedbackModal}
					/>
					<StatusBar style="auto" />
				</View>
			</BooleanProvider>
		</CartProvider>
		</TranslationProvider>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
});

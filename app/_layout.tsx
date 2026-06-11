"use client";

import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";
import { BooleanProvider } from "@/contexts/CartBoolContext";
import { CartProvider } from "@/contexts/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
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

	// Set up push notifications (permissions, token registration, tap handling)
	useNotifications();



	// For Lower.js overlays
	const [menuOpen, setMenuOpen] = useState(false);
	const [categories, setCategories] = useState([]);
	// Fetch categories
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch(
					"https://frischly-dash-leb.onrender.com/api/categories"
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

	return (
		<TranslationProvider>
		<CartProvider>
			<BooleanProvider>
				<View style={styles.container}>
					{showHeader && <Header />} {/* Show header conditionally */}
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
							name="track/[id]"
							options={{ headerShown: false }}
						/>

						<Stack.Screen name="+not-found" />
					</Stack>
					{showBottomNav && <BottomNav />}
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

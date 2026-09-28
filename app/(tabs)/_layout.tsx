import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { API_BASE_URL } from "@/constants/api";
import { globalStyles } from "@/constants/GlobalStyles";
import { colors } from "@/constants/theme";
import { VISIBLE_TABS } from "@/constants/navigation";
import { useCart } from "@/contexts/CartContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { styles } from "@/styles/app/(tabs)/_layout.styles";

export default function TabLayout() {
	const { cart } = useCart();
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	// Tabs to show
	const visibleTabs = VISIBLE_TABS;
	// Check login
useEffect(() => {
		// Guest launches have NO userData at all: every read below is optional
		// so an unauthenticated session renders the tabs instead of crashing.
		const checkLogin = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				if (!userData && !guest) {
					router.replace("/start");
					return;
				}

				const parsedUser = userData ? JSON.parse(userData) : null;
				const token = parsedUser?.token ?? null;
				if (!token) {
					setLoading(false);
					return;
				}

				// Warm the profile so downstream screens have a fresh copy; a
				// failure here must never block the tabs.
				const res = await fetch(`${API_BASE_URL}/auth/me`, {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});
				if (res.ok) {
					const data = await res.json().catch(() => null);
					const user = data?.data?.user ?? null;
					if (user && parsedUser) {
						await AsyncStorage.setItem(
							"userData",
							JSON.stringify({ ...parsedUser, user }),
						);
					}
				}
			} catch (err) {
				console.error("checkLogin error:", err);
			} finally {
				setLoading(false);
			}
		};

		checkLogin();
	}, [router]);

 

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	return (
		<View style={globalStyles.flex1}>

		     
     
			{/* Bottom Tabs */}
			<Tabs
				screenOptions={{
					tabBarShowLabel: false,
					tabBarActiveTintColor: colors.text,
					tabBarInactiveTintColor: colors.textDisabled,
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarBackground: TabBarBackground,
					// The global bottom navigation (rendered in app/_layout.tsx) replaces
					// this built-in bar so it can appear on every page of the app.
					tabBarStyle: { display: "none" },
				}}
			>
				{visibleTabs.includes("index") && (
					<Tabs.Screen
						name="index"
						options={{
							tabBarIcon: ({ color, size }) => (
								<Feather name="home" size={size} color={color} />
							),
						}}
					/>
				)}

				{visibleTabs.includes("menu") && (
					<Tabs.Screen
						name="menu"
						options={{
							tabBarIcon: ({ color, size }) => (
								<Feather name="menu" size={size} color={color} />
							),
						}}
					/>
				)}

				{visibleTabs.includes("cart") && (
					<Tabs.Screen
						name="cart"
						options={{
							tabBarIcon: ({ color, size }) => (
								<View>
									<Feather name="shopping-cart" size={size} color={color} />
									{cart && cart.length > 0 && <View style={styles.cartBadge} />}
								</View>
							),
						}}
					/>
				)}

				{visibleTabs.includes("acc") && (
					<Tabs.Screen
						name="acc"
						options={{
							tabBarIcon: ({ color, size }) => (
								<Feather name="user" size={size} color={color} />
							),
						}}
					/>
				)}
			</Tabs>
		</View>
	);
}

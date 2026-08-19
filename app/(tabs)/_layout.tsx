import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { API_BASE_URL } from "@/constants/api";
import { globalStyles } from "@/constants/GlobalStyles";
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
	const visibleTabs = ["index", "menu", "cart", "acc"];
	// Check login
useEffect(() => {
	const checkLogin = async () => {
		console.log("🔍 checkLogin started");

		const userData = await AsyncStorage.getItem("userData");
		const guest = await AsyncStorage.getItem("guest");

		console.log("📦 userData:", userData);
		console.log("👤 guest:", guest);

		if (!userData && !guest) {
			console.warn("🚪 No user or guest found → redirecting");
			router.replace("/start");
			return;
		}

		try {
			const parsedUser = userData ? JSON.parse(userData) : null;
			const token = parsedUser?.token;

			console.log("🔑 Auth token:", token);

			if (!token) {
				console.error("⚠️ No token found in userData");
				setLoading(false);
				return;
			}

			// 🔹 Fetch logged-in user
			console.log("📡 Fetching /api/auth/me");

			const res = await fetch(
				`${API_BASE_URL}/auth/me`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			console.log("📨 /me response status:", res.status);

			if (!res.ok) {
				console.error("❌ Failed to fetch user");
				setLoading(false);
				return;
			}

			const data = await res.json();
			const user = data.data.user;

			console.log("✅ User fetched:", user);

		} catch (err) {
			console.error("🔥 Network/Fetch error:", err);
		}

		setLoading(false);
		console.log("🏁 checkLogin finished");
	};

	checkLogin();
}, [router]);

 

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	return (
		<View style={globalStyles.flex1}>

		     
     
			{/* Bottom Tabs */}
			<Tabs
				screenOptions={{
					tabBarShowLabel: false,
					tabBarActiveTintColor: "#000000",
					tabBarInactiveTintColor: "#f4bb26",
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

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useCart } from "@/contexts/CartContext";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Tabs, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { usePushNotifications } from "../../usePushNotifications";

export default function TabLayout() {
	const { cart } = useCart();
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const [user, setUser] = useState(null); 
	// Tabs to show
	const visibleTabs = ["index", "menu", "cart", "acc"];
	  const { expoPushToken } = usePushNotifications(); 
console.log("expoPushToken:", expoPushToken?.data);
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
				"https://frischlyshop-server.onrender.com/api/auth/me",
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
			setUser(user);

			// 🔹 Send FCM token to server after login
			const fcmToken = expoPushToken?.data; // or however you get it
			if (fcmToken) {
				console.log("📲 Sending FCM token to server:", fcmToken);

				const fcmRes = await fetch(
					"https://frischlyshop-server.onrender.com/api/notifications/token",
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							userId: user._id, // assuming user._id is the ID
							fcmToken: fcmToken,
						}),
					}
				);

				if (fcmRes.ok) {
					console.log("✅ FCM token sent successfully");
				} else {
					console.error("❌ Failed to send FCM token:", fcmRes.status);
				}
			} else {
				console.warn("⚠️ No FCM token found to send");
			}

		} catch (err) {
			console.error("🔥 Network/Fetch error:", err);
		}

		setLoading(false);
		console.log("🏁 checkLogin finished");
	};

	checkLogin();
}, [router, expoPushToken?.data]);

 

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color="#FFC300" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>

		     
     
			{/* Bottom Tabs */}
			<Tabs
				screenOptions={{
					tabBarShowLabel: false,
					tabBarActiveTintColor: "#000000",
					tabBarInactiveTintColor: "#FFC300",
					headerShown: false,
					tabBarButton: HapticTab,
					tabBarBackground: TabBarBackground,
					tabBarStyle: Platform.select({
						ios: { position: "absolute" },
						default: { backgroundColor: "#FFFFFF" },
					}),
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

const styles = StyleSheet.create({
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "#FFC300",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
});

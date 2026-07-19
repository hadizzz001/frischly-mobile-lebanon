import { useCart } from "@/contexts/CartContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE_COLOR = "#000000";
const INACTIVE_COLOR = "#f4bb26";

// Mirrors the tabs declared in app/(tabs)/_layout.tsx
const TABS = [
	{ key: "home", icon: "home", path: "/" },
	{ key: "menu", icon: "menu", path: "/menu" },
	{ key: "cart", icon: "shopping-cart", path: "/cart" },
	{ key: "acc", icon: "user", path: "/acc" },
];

export default function BottomNav() {
	const router = useRouter();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const { cart } = useCart();

	const isActive = (path: string) => {
		if (path === "/") return pathname === "/";
		return pathname === path || pathname.startsWith(`${path}/`);
	};

	const handlePress = (path: string) => {
		if (Platform.OS === "ios") {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
		router.navigate(path as never);
	};

	return (
		<View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
			{TABS.map((tab) => {
				const active = isActive(tab.path);
				const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;

				return (
					<TouchableOpacity
						key={tab.key}
						style={styles.tab}
						activeOpacity={0.7}
						onPress={() => handlePress(tab.path)}
					>
						<View>
							<Feather name={tab.icon as never} size={24} color={color} />
							{tab.key === "cart" && cart && cart.length > 0 && (
								<View style={styles.cartBadge} />
							)}
						</View>
					</TouchableOpacity>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		backgroundColor: "#FFFFFF",
		paddingTop: 10,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: "#E5E5E5",
	},
	tab: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
});

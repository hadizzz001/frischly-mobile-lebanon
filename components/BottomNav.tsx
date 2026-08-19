import { useCart } from "@/contexts/CartContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { Platform, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "@/styles/components/BottomNav.styles";

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

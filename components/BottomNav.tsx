import { usePathname, useRouter } from "expo-router";
import { House, LayoutGrid, ShoppingCart, UserRound } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
	BOTTOM_NAV_ACTIVE_COLOR as ACTIVE_COLOR,
	BOTTOM_NAV_INACTIVE_COLOR as INACTIVE_COLOR,
	BOTTOM_NAV_TABS as TABS,
} from "@/constants/navigation";
import { icon } from "@/constants/theme";
import { useCart } from "@/contexts/CartContext";
import { styles } from "@/styles/components/BottomNav.styles";
import { tapLight } from "@/utils/haptics";

const ICONS = {
	home: House,
	menu: LayoutGrid,
	"shopping-cart": ShoppingCart,
	user: UserRound,
} as const;

export default function BottomNav() {
	const router = useRouter();
	const pathname = usePathname();
	const insets = useSafeAreaInsets();
	const { cart } = useCart();
	const count = cart?.reduce((n, item) => n + (item.quantity || 1), 0) ?? 0;

	const isActive = (path: string) => {
		if (path === "/") return pathname === "/";
		return pathname === path || pathname.startsWith(`${path}/`);
	};

	const handlePress = (path: string) => {
		tapLight();
		router.navigate(path as never);
	};

	return (
		<View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
			{TABS.map((tab) => {
				const active = isActive(tab.path);
				const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
				const Icon = ICONS[tab.icon as keyof typeof ICONS] ?? House;

				return (
					<Pressable
						key={tab.key}
						style={styles.tab}
						onPress={() => handlePress(tab.path)}
						accessibilityRole="tab"
						accessibilityState={{ selected: active }}
					>
						<View style={[styles.iconWrap, active && styles.iconWrapActive]}>
							<Icon size={icon.sizeLarge} strokeWidth={active ? 2.4 : icon.strokeWidth} color={color} />
							{tab.key === "cart" && count > 0 && (
								<View style={styles.cartBadge}>
									<Text style={styles.cartBadgeText}>{count > 99 ? "99+" : count}</Text>
								</View>
							)}
						</View>
					</Pressable>
				);
			})}
		</View>
	);
}

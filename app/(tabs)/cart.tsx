import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Cart from "@/components/Cart";
import { styles } from "@/styles/app/(tabs)/cart.styles";

// The header renders above this screen and the bottom nav below it, so only
// the top inset is needed here; the cart's own sticky bar handles the bottom.
export default function CartScreen() {
	return (
		<SafeAreaView edges={[]} style={styles.container}>
			<View style={styles.content}>
				<Cart />
			</View>
		</SafeAreaView>
	);
}

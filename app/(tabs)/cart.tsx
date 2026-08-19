import Cart from "@/components/Cart";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/styles/app/(tabs)/cart.styles";

export default function CartScreen() {
  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Cart />
      </View>
    </SafeAreaView>
  );
}

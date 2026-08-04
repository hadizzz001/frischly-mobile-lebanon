import Cart from "@/components/Cart";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingTop: 20, paddingBottom: 80 },
});

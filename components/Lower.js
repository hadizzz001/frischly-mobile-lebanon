import Cart from "@/components/Cart";
import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Lower({ menuOpen, setMenuOpen, categories }) {
  const { isBooleanValue, setBooleanValue } = useBooleanValue();
  const { t, td } = useTranslation();

  return (
    <>
      {/* Fullscreen Menu Overlay */}
      {menuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuCloseBtn}
            onPress={() => setMenuOpen(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <ScrollView contentContainerStyle={styles.menuContent}>
            <Text style={styles.menuTitle}>{t("allCategories")}</Text>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setMenuOpen(false)}
              >
                <Text style={styles.menuItem}>{td(cat.name)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Cart Overlay */}
      {isBooleanValue && (
        <View style={styles.cartOverlay}>
          <TouchableOpacity
            style={styles.cartCloseBtn}
            onPress={() => setBooleanValue(false)}
          >
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Cart />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: 50,
  },
  menuCloseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  menuContent: {
    paddingTop: 100,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  menuTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  menuItem: {
    fontSize: 18,
    color: "#000",
    marginVertical: 10,
  },
  cartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: 100,
    paddingTop: 60,
  },
  cartCloseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
});

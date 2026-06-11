import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { getUserCity } from "@/utils/userCity";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 2.4; // a bit wider than markets so the button fits

const API_BASE_URL = "https://frischly-dash-leb.onrender.com/api";

// Keep only items that can actually be ordered (active + in stock) and attach a
// default quantity of 1 each.
export const getKitchenCartItems = (kitchen) =>
	(kitchen?.items || [])
		.filter(
			(p) => p && p._id && p.isActive !== false && Number(p.stock || 0) > 0,
		)
		.map((p) => ({ ...p, quantity: 1 }));

export default function KitchenSlider({ refreshTrigger }) {
	const { t, td } = useTranslation();
	const router = useRouter();
	const { addItemsToCart, kitchenCheckoutIds, markKitchenAdded } = useCart();

	const [kitchens, setKitchens] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchKitchens = async () => {
		try {
			setLoading(true);

			// Determine the logged-in user's city (guests have no city).
			// getUserCity() refreshes from /api/auth/me so stale logins still work.
			const city = await getUserCity();

			const res = await fetch(`${API_BASE_URL}/kitchens/public`);
			const json = await res.json();
			const all = Array.isArray(json?.data) ? json.data : [];

			// Logged-in user with a city => only kitchens from that city, plus
			// main-store kitchens (no market) which belong to the main admin store
			// and are shown to everyone. Guests (no city) see all kitchens.
			const filtered = city
				? all.filter((k) => {
						if (!k?.market) return true;
						const kCity = k?.market?.location?.city || "";
						return (
							kCity.trim().toLowerCase() === city.trim().toLowerCase()
						);
				  })
				: all;

			setKitchens(filtered);
		} catch (err) {
			console.error("KitchenSlider fetch error:", err);
			setKitchens([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchKitchens();
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) fetchKitchens();
	}, [refreshTrigger]);

	// Add all of a kitchen's available items to the cart. Out-of-stock / inactive
	// items are skipped. The cart enforces a single market source, so if the cart
	// already has items from another market the user is asked to restore it first.
	const addKitchenToCart = (kitchen) => {
		const items = getKitchenCartItems(kitchen);

		if (!items.length) {
			Alert.alert(t("errorTitle"), t("kitchenNoItems"));
			return;
		}

		const totalActive = (kitchen.items || []).filter(
			(p) => p && p._id && p.isActive !== false,
		).length;
		const skipped = totalActive - items.length;

		const result = addItemsToCart(items);

		// When there is a different-market conflict, addItemsToCart shows its own
		// restore dialog, so we only show the success message when items were added.
		if (result?.added) {
			markKitchenAdded(kitchen._id);
			Alert.alert(
				t("success"),
				skipped > 0 ? t("kitchenAddedWithSkipped") : t("kitchenAddedToCart"),
			);
		}
	};

	if (loading) {
		return (
			<View style={styles.loaderBox}>
				<ActivityIndicator size="small" color="#f4bb26" />
			</View>
		);
	}

	if (!kitchens.length) {
		return null;
	}

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{t("kitchens")}</Text>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.track}
			>
				{kitchens.map((kitchen) => {
					const addableItems = getKitchenCartItems(kitchen);
					const addableCount = addableItems.length;
					// Driven ONLY by this kitchen's own id (persisted in the cart
					// context), so it survives navigation and never affects another
					// kitchen — even when they share the same products.
					const inCart = !!kitchenCheckoutIds[kitchen._id];

					return (
						<View key={kitchen._id} style={styles.card}>
							<TouchableOpacity
								activeOpacity={0.85}
								onPress={() => router.push(`/kitchen/${kitchen._id}`)}
							>
								<View style={styles.imageWrapper}>
									{kitchen.picture ? (
										<Image
											source={{ uri: kitchen.picture }}
											style={styles.image}
											resizeMode="cover"
										/>
									) : (
										<Text style={styles.placeholder}>
											{(kitchen.name || "?").charAt(0).toUpperCase()}
										</Text>
									)}
								</View>
								<Text style={styles.name} numberOfLines={1}>
									{td(kitchen.name)}
								</Text>
								<Text style={styles.itemCount}>
									{addableCount} {t("items")}
								</Text>
							</TouchableOpacity>

							{inCart ? (
								<TouchableOpacity
									style={styles.checkoutBtn}
									activeOpacity={0.85}
									onPress={() => router.push("/checkout")}
								>
									<Feather name="credit-card" size={16} color="#fff" />
									<Text style={styles.addBtnText}>{t("goToCheckout")}</Text>
								</TouchableOpacity>
							) : (
								<TouchableOpacity
									style={[
										styles.addBtn,
										addableCount === 0 && styles.addBtnDisabled,
									]}
									activeOpacity={0.85}
									disabled={addableCount === 0}
									onPress={() => addKitchenToCart(kitchen)}
								>
									<Feather name="shopping-cart" size={16} color="#fff" />
									<Text style={styles.addBtnText}>{t("addAllToCart")}</Text>
								</TouchableOpacity>
							)}
						</View>
					);
				})}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: "#fff",
		marginTop: 8,
		paddingBottom: 10,
	},
	loaderBox: {
		height: 120,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000" },
	track: {
		paddingHorizontal: 8,
	},
	card: {
		width: ITEM_WIDTH,
		marginHorizontal: 5,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 8,
	},
	imageWrapper: {
		width: "100%",
		height: 110,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
		overflow: "hidden",
	},
	image: { width: "100%", height: "100%" },
	placeholder: {
		fontSize: 34,
		fontWeight: "700",
		color: "#f4bb26",
	},
	name: {
		fontSize: 14,
		fontWeight: "600",
		color: "#222",
		textAlign: "center",
	},
	itemCount: {
		fontSize: 12,
		color: "#777",
		textAlign: "center",
		marginBottom: 8,
	},
	addBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "#f4bb26",
		borderRadius: 8,
		paddingVertical: 8,
	},
	addBtnDisabled: {
		backgroundColor: "#cccccc",
	},
	checkoutBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 6,
		backgroundColor: "#22a45d",
		borderRadius: 8,
		paddingVertical: 8,
	},
	addBtnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 13,
	},
});

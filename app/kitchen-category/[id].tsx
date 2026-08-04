import { filterByCity, getKitchenCartItems } from "@/components/KitchenSlider";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { KitchenService } from "@/services/api";
import type { Kitchen } from "@/types";
import { getAdminCities, getAdminDeliveryRegions } from "@/utils/cityVisibility";
import { rtlRow } from "@/utils/rtl";
import { getUserCityAndPin } from "@/utils/userCity";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
// Two cards per row: 12px outer padding on each side + 12px gutter between.
const CARD_WIDTH = (width - 36) / 2;

// Lists every kitchen that belongs to a single kitchen category. Reached from
// the home screen's category slider. Tapping a kitchen opens /kitchen/[id]
// (the existing screen) with that kitchen's items.
export default function KitchenCategoryPage() {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const { id, name, marketId } = useLocalSearchParams<{
		id: string;
		name?: string;
		marketId?: string;
	}>();
	const { addItemsToCart, kitchenCheckoutIds, markKitchenAdded } = useCart();

	const [kitchens, setKitchens] = useState<Kitchen[]>([]);
	const [loading, setLoading] = useState(true);
	// Show the category name straight away (passed from the slider), falling back
	// to whatever the API reports on the kitchens themselves.
	const [title, setTitle] = useState(typeof name === "string" ? name : "");

	// Read a kitchen's market id whether `market` is a plain id string or a
	// populated Market object (same helper as KitchenSlider).
	const kitchenMarketId = (k: Kitchen): string | null => {
		const m = k.market;
		if (!m) return null;
		return typeof m === "string" ? m : m._id || null;
	};

	useEffect(() => {
		const fetchKitchens = async () => {
			try {
				setLoading(true);

				// Same city + delivery-range rule as the home slider: a logged-in
				// user only sees kitchens whose market serves that city (plus
				// main-store kitchens that the admin serves in that city AND whose
				// delivery-range circle covers the shopper's exact map pin).
				const [{ city, pin }, adminCities, adminRegions] = await Promise.all([
					getUserCityAndPin(),
					getAdminCities(),
					getAdminDeliveryRegions(),
				]);

				// NOTE: the public endpoint currently ignores the `category` query
				// param and returns every kitchen, so we must filter by category id
				// ourselves. Each kitchen carries a populated `category` object.
				const res = await KitchenService.listPublicByCategory(id);
				const all = Array.isArray(res?.data) ? res.data : [];

				let inCategory = all.filter((k) => {
					const cat = k?.category;
					const catId =
						cat && typeof cat === "object" ? cat._id : cat;
					return String(catId) === String(id);
				});

				// Reached from a single market's home page: only show that
				// market's own kitchens within this category.
				if (marketId) {
					inCategory = inCategory.filter(
						(k) => kitchenMarketId(k) === String(marketId),
					);
				}

				const filtered = filterByCity(inCategory, city, adminCities, pin, adminRegions);

				setKitchens(filtered);

				// Derive the header title from the data when it wasn't passed in.
				if (!title) {
					const firstCat = filtered[0]?.category;
					const fromData =
						firstCat && typeof firstCat === "object"
							? firstCat.name
							: undefined;
					if (fromData) setTitle(fromData);
				}
			} catch (err) {
				console.error("Kitchen category fetch error:", err);
				setKitchens([]);
			} finally {
				setLoading(false);
			}
		};
		if (id) fetchKitchens();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, marketId]);


	// Add all of a kitchen's available items to the cart. Out-of-stock / inactive
	// items are skipped. The cart enforces a single market source, so a conflict
	// triggers addItemsToCart's own restore dialog.
	const addKitchenToCart = (kitchen: Kitchen) => {
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

		if (result?.added) {
			markKitchenAdded(kitchen._id);
			Alert.alert(
				t("success"),
				skipped > 0 ? t("kitchenAddedWithSkipped") : t("kitchenAddedToCart"),
			);
		}
	};

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView edges={["top"]} style={styles.safeArea}>
				<View style={[styles.topBar, rtlRow(isRTL)]}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="chevron-left" size={24} color="#222" />
					</TouchableOpacity>
					<Text style={styles.topTitle} numberOfLines={1}>
						{title ? td(title) : t("kitchens")}
					</Text>
					<View style={styles.spacer36} />
				</View>

				{loading ? (
					<View style={styles.center}>
						<ActivityIndicator size="large" color="#f4bb26" />
					</View>
				) : !kitchens.length ? (
					<View style={styles.center}>
						<Text style={styles.emptyText}>{t("noKitchensInCategory")}</Text>
					</View>
				) : (
					<ScrollView contentContainerStyle={styles.grid}>
						{kitchens.map((kitchen) => {
							const addableCount = getKitchenCartItems(kitchen).length;
							// Per-kitchen flag persisted in the cart context, so the
							// "Go to Checkout" button survives navigation.
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
											<Text style={styles.btnText}>{t("goToCheckout")}</Text>
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
											<Text style={styles.btnText}>{t("addAllToCart")}</Text>
										</TouchableOpacity>
									)}
								</View>
							);
						})}
					</ScrollView>
				)}
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	safeArea: { flex: 1, backgroundColor: "#fff" },
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#fff",
		paddingTop: 80,
	},
	topBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 8,
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: "#f0f0f0",
	},
	backButton: {
		width: 36,
		height: 36,
		justifyContent: "center",
		alignItems: "center",
	},
	topTitle: {
		flex: 1,
		fontSize: 18,
		fontWeight: "700",
		color: "#222",
		textAlign: "center",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingTop: 12,
		paddingBottom: 140,
	},
	card: {
		width: CARD_WIDTH,
		marginBottom: 14,
		backgroundColor: "#fff",
		borderRadius: 10,
		borderWidth: 1,
		borderColor: "#eee",
		padding: 8,
	},
	imageWrapper: {
		width: "100%",
		height: 120,
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
	btnText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 13,
	},
	emptyText: {
		fontSize: 14,
		color: "#777",
		textAlign: "center",
		paddingHorizontal: 16,
	},
	root: { flex: 1, backgroundColor: "#fff" },
	spacer36: { width: 36 },
});

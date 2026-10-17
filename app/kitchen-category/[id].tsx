import BackButton from "@/components/ui/BackButton";
import { useCart } from "@/contexts/CartContext";
import { useTranslation } from "@/contexts/TranslationContext";
import { useBusyAction } from "@/hooks/useBusyAction";
import { useGoToCheckout } from "@/hooks/useGoToCheckout";
import type { Kitchen } from "@/types";
import {
	getKitchenCartItems,
	isKitchenInCart,
	loadStoreKitchens,
} from "@/utils/kitchen";
import { rtlRow } from "@/utils/rtl";
import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "@/styles/app/kitchen-category/[id].styles";

// Lists the kitchens of ONE store that are filed under a single kitchen
// category. Reached from a kitchen slider: from the home screen it lists
// FreshlyLB's own kitchens, from a market page (`?marketId=`) that market's
// own. Tapping a kitchen opens /kitchen/[id] with that kitchen's items.
export default function KitchenCategoryPage() {
	const { t, td, isRTL } = useTranslation();
	const router = useRouter();
	const { id, name, marketId } = useLocalSearchParams<{
		id: string;
		name?: string;
		marketId?: string;
	}>();
	const { addItemsToCart, cart } = useCart();
	const { isBusy, anyBusy, run } = useBusyAction();
	const { goToCheckout, preparing: preparingCheckout, isPreparing } = useGoToCheckout();

	const [kitchens, setKitchens] = useState<Kitchen[]>([]);
	const [loading, setLoading] = useState(true);
	// Show the category name straight away (passed from the slider), falling back
	// to whatever the API reports on the kitchens themselves.
	const [title, setTitle] = useState(typeof name === "string" ? name : "");

	useEffect(() => {
		let cancelled = false;

		const fetchKitchens = async () => {
			try {
				setLoading(true);

				// One shared loader for the slider and this screen, scoped to the
				// store the shopper came from: `marketId` -> that market's own
				// kitchens, otherwise FreshlyLB's. It applies the store's
				// visibility rule too, so this list always matches the category
				// card that opened it.
				const list = await loadStoreKitchens(marketId, id);
				if (cancelled) return;

				setKitchens(list);

				// Derive the header title from the data when it wasn't passed in.
				if (!title) {
					const firstCat = list[0]?.category;
					const fromData =
						firstCat && typeof firstCat === "object"
							? firstCat.name
							: undefined;
					if (fromData) setTitle(fromData);
				}
			} catch (err) {
				console.error("Kitchen category fetch error:", err);
				if (!cancelled) setKitchens([]);
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		if (id) fetchKitchens();
		return () => {
			cancelled = true;
		};
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

		run(`add-${kitchen._id}`, () => {
			const result = addItemsToCart(items);

			if (result?.added) {
				Alert.alert(
					t("success"),
					skipped > 0 ? t("kitchenAddedWithSkipped") : t("kitchenAddedToCart"),
				);
			}
		});
	};

	return (
		<View style={styles.root}>
			<Stack.Screen options={{ headerShown: false }} />
			<SafeAreaView edges={[]} style={styles.safeArea}>
				<View style={[styles.topBar, rtlRow(isRTL)]}>
					<BackButton onPress={() => router.back()} style={styles.backButton} />
					<Text style={styles.topTitle} numberOfLines={1}>
						{title ? td(title) : t("kitchens")}
					</Text>
					<View style={styles.spacer36} />
				</View>

				{loading ? (
					<View style={styles.center}>
						<ActivityIndicator size="large" color="#F59E0B" />
					</View>
				) : !kitchens.length ? (
					<View style={styles.center}>
						<Text style={styles.emptyText}>{t("noKitchensInCategory")}</Text>
					</View>
				) : (
					<ScrollView contentContainerStyle={[styles.grid, rtlRow(isRTL)]}>
						{kitchens.map((kitchen) => {
							const addableItems = getKitchenCartItems(kitchen);
							const addableCount = addableItems.length;
							// Read straight from the cart: the button flips back to
							// "Add all to cart" as soon as any of this kitchen's items
							// are removed or the order is placed (a persisted
							// per-kitchen flag used to keep showing "Go to Checkout"
							// forever). Kitchens that merely share a product with the
							// one that was added stay on "Add all to cart".
							const inCart = isKitchenInCart(kitchen, cart);

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
											style={[styles.checkoutBtn, rtlRow(isRTL)]}
											activeOpacity={0.85}
											disabled={preparingCheckout}
											onPress={() => goToCheckout(String(kitchen._id))}
										>
											{isPreparing(String(kitchen._id)) ? (
												<ActivityIndicator size="small" color="#111827" />
											) : (
												<>
													<Feather name="credit-card" size={14} color="#111827" />
													<Text
														style={styles.btnText}
														numberOfLines={1}
														adjustsFontSizeToFit
														minimumFontScale={0.7}
													>
														{t("goToCheckout")}
													</Text>
												</>
											)}
										</TouchableOpacity>
									) : (
										<TouchableOpacity
											style={[
												styles.addBtn,
												rtlRow(isRTL),
												addableCount === 0 && styles.addBtnDisabled,
											]}
											activeOpacity={0.85}
											disabled={addableCount === 0 || anyBusy}
											onPress={() => addKitchenToCart(kitchen)}
										>
											{isBusy(`add-${kitchen._id}`) ? (
												<ActivityIndicator size="small" color="#111827" />
											) : (
												<>
													<Feather
														name="shopping-cart"
														size={14}
														color="#111827"
													/>
													<Text
														style={styles.btnText}
														numberOfLines={1}
														adjustsFontSizeToFit
														minimumFontScale={0.7}
													>
														{t("addAllToCart")}
													</Text>
												</>
											)}
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

"use client";
import { useTranslation } from "@/contexts/TranslationContext";
import {
    AuthService,
    CategoryService,
    MarketService,
    ProductService,
} from "@/services/api";
import type { MarketCategory } from "@/services/api/marketService";
import type { ProductQuery } from "@/services/api/productService";
import type { Category, Market, Product, Subcategory, User } from "@/types";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    ScrollView,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { useBooleanValue } from "@/contexts/CartBoolContext";
import { useCart } from "@/contexts/CartContext";
import {
    cityMatches,
    entityServesCity,
    getAdminCities,
    isCityServedByAdmin,
} from "@/utils/cityVisibility";
import { getUserCity } from "@/utils/userCity";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 3 - 12; // 3 items per row, adjust margin

export default function ShopPage() {
	const { t, td } = useTranslation();

	const router = useRouter();
	const searchParams = useLocalSearchParams<{
		discount?: string;
		category?: string;
		market?: string;
		marketName?: string;
		marketCat?: string;
		search?: string;
		terms?: string;
	}>();

	console.log("Sear ", searchParams);

	// ✅ discount & category from query params
	const discountParam = searchParams.discount ?? "";
	const categoryParam = searchParams.category ?? "";
	const marketParam = searchParams.market ?? "";
	const marketNameParam = searchParams.marketName ?? "";
	const marketCatParam = searchParams.marketCat ?? "";

	const [menuOpen, setMenuOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);
	const [categories, setCategories] = useState<Category[]>([]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const { isBooleanValue, setBooleanValue } = useBooleanValue();
	const [user, setUser] = useState<User | null>(null);
	const [filterOpen, setFilterOpen] = useState(false);
	const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
	// Each market has its own categories/subcategories (the MarketCategory
	// collection), fetched from /api/markets/:id/categories.
	const [marketCats, setMarketCats] = useState<MarketCategory[]>([]);
	const [marketCatId, setMarketCatId] = useState("");
	const [marketSubId, setMarketSubId] = useState("");
	const searchParam = searchParams.search ?? "";
	// Voice / multi-item search: a comma-separated list of recognised items, e.g.
	// ?terms=ketchup,potato,tomato. When present we run a merged search for all of
	// them instead of the normal single-category fetch.
	const termsParam = searchParams.terms ?? "";
	const searchTerms = useMemo(
		() =>
			termsParam
				? termsParam
						.split(",")
						.map((s) => decodeURIComponent(s).trim())
						.filter(Boolean)
				: [],
		[termsParam]
	);
	const isMultiSearch = searchTerms.length > 0;
	const [page, setPage] = useState(1);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isFetchingMore, setIsFetchingMore] = useState(false);

	const [filters, setFilters] = useState<{
		search: string;
		category: string;
		subcategory: string;
		shelfNumber: string;
		sortBy: string;
		sortOrder: "asc" | "desc";
		priceRange: string;
		stockLevel: string;
		discount: boolean;
		minDiscount: number;
	}>({
		search: searchParam,
		category: categoryParam,
		subcategory: "",
		shelfNumber: "",
		sortBy: "price",
		sortOrder: "desc",
		priceRange: "",
		stockLevel: "",
		discount: false,
		minDiscount: 5,
	});
	// Inside ShopPage component

	const { cart, addToCart, removeFromCart } = useCart();
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [showQty, setShowQty] = useState<Record<string, boolean>>({}); // Track which products show qty

	// Keep the +/- quantity UI in sync with the actual cart (also reflects a
	// cart "restore" when switching markets).
	useEffect(() => {
		const nextQuantities: Record<string, number> = {};
		const nextShowQty: Record<string, boolean> = {};
		cart.forEach((cartItem) => {
			nextQuantities[cartItem._id] = cartItem.quantity || 1;
			nextShowQty[cartItem._id] = true;
		});
		setQuantities(nextQuantities);
		setShowQty(nextShowQty);
	}, [cart]);

	const increaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;

		// ✅ Do not allow exceeding stock
		if (currentQty >= product.stock) {
			return; // Stop here if qty == stock
		}

		const newQty = currentQty + 1;
		// Adding from a different market shows a confirm dialog and is applied
		// asynchronously, so only reflect the change locally when it was added.
		const result = addToCart(product, newQty);
		if (result?.added) {
			setQuantities({ ...quantities, [product._id]: newQty });
			setShowQty({ ...showQty, [product._id]: true });
		}
	};

	const decreaseQty = (product: Product) => {
		const currentQty = quantities[product._id] || 0;

		if (currentQty <= 1) {
			const updatedQuantities = { ...quantities };
			delete updatedQuantities[product._id];
			setQuantities(updatedQuantities);
			removeFromCart(product._id);
			setShowQty({ ...showQty, [product._id]: false });
		} else {
			const newQty = currentQty - 1;
			setQuantities({ ...quantities, [product._id]: newQty });

			addToCart(product, newQty);
		}
	};

	const token =
		Constants.expoConfig?.extra?.jwtToken || process.env.EXPO_PUBLIC_JWT_TOKEN;

	const toggleCart = () => setBooleanValue(!isBooleanValue);

	// ✅ Fetch categories
	useEffect(() => {
		CategoryService.list()
			.then((res) => setCategories(res.data || []))
			.catch((err) => console.error(err));
	}, []);

	useEffect(() => {
		const getSubcategories = async () => {
			try {
				const res = await CategoryService.subcategories();
				if (res.success) {
					setSubcategories(res.data); // <-- only use the "data" array
				}
			} catch (err) {
				console.error("Failed to fetch subcategories:", err);
			}
		};

		getSubcategories();
	}, []);

	// Load this market's OWN categories + subcategories. Each market defines its
	// taxonomy in the MarketCategory/MarketSubcategory collections. We must NOT
	// derive these from product tags: some markets tag products with main-store
	// categories, which would surface categories the market never created.
	useEffect(() => {
		setMarketCatId("");
		setMarketSubId("");
		if (!marketParam) {
			setMarketCats([]);
			return;
		}
		let cancelled = false;
		MarketService.categories(marketParam)
			.then((res) => {
				if (!cancelled) {
					setMarketCats(Array.isArray(res?.data) ? res.data : []);
				}
			})
			.catch(() => {
				if (!cancelled) setMarketCats([]);
			});
		return () => {
			cancelled = true;
		};
	}, [marketParam]);

	// The currently selected market category (with its subcategories).
	const selectedMarketCat = useMemo(
		() => marketCats.find((c) => String(c._id) === marketCatId),
		[marketCats, marketCatId]
	);

	// Preselect a market category when arriving from the market home page
	// (?marketCat=<id>), once this market's categories have loaded.
	useEffect(() => {
		if (!marketCatParam || !marketCats.length) return;
		const match = marketCats.find(
			(c) => String(c._id) === String(marketCatParam)
		);
		if (match) {
			setMarketCatId(String(match._id));
			setMarketSubId("");
		}
	}, [marketCatParam, marketCats]);

	// Products shown in the market grid, filtered by the selected category /
	// subcategory. Matching is done on the product's subcategory id against this
	// market's own subcategory ids, so only the market's taxonomy is used.
	const displayedProducts = useMemo(() => {
		if (!marketParam) return products;
		if (marketSubId) {
			return products.filter(
				(p) => String((p?.subcategory as Subcategory)?._id) === marketSubId
			);
		}
		if (marketCatId) {
			const subIds = new Set(
				(selectedMarketCat?.subcategories || []).map((s) => String(s._id))
			);
			return products.filter((p) =>
				subIds.has(String((p?.subcategory as Subcategory)?._id))
			);
		}
		return products;
	}, [products, marketParam, marketCatId, marketSubId, selectedMarketCat]);

	// "Global search" = a free-text search that isn't scoped to a single market
	// and isn't a voice multi-search. In this mode we search BOTH the main store
	// AND every market, then group the results by market so each market's items
	// appear under their own header (instead of being condensed together).
	const isGlobalSearch = useMemo(
		() =>
			!marketParam &&
			!isMultiSearch &&
			String(filters.search || "").trim().length > 0,
		[marketParam, isMultiSearch, filters.search]
	);

	// Read a market's display name (handles plain string or { en, ar } object).
	const marketTitle = (m?: Market | null) => {
		if (!m) return t("mainStore");
		const n = m.name;
		if (!n) return t("market");
		return td(typeof n === "string" ? n : String(n));
	};

	// Group the global-search results by market into SectionList sections. The
	// main store comes first, then each market. Every section's `data` is an
	// array of rows (up to 3 products each) so we keep the 3-per-row grid.
	const searchSections = useMemo(() => {
		if (!isGlobalSearch) return [];

		const groups = new Map<
			string,
			{ key: string; market: Market | null; items: Product[] }
		>();
		displayedProducts.forEach((p) => {
			const m = p?.market as Market | null | undefined;
			const key = m?._id ? String(m._id) : "__main__";
			if (!groups.has(key)) {
				groups.set(key, { key, market: m || null, items: [] });
			}
			groups.get(key)!.items.push(p);
		});

		// Main store first, markets after (in insertion order).
		const ordered = [...groups.values()].sort((a, b) =>
			a.key === "__main__" ? -1 : b.key === "__main__" ? 1 : 0
		);

		return ordered.map((g) => {
			const rows: Product[][] = [];
			for (let i = 0; i < g.items.length; i += 3) {
				rows.push(g.items.slice(i, i + 3));
			}
			return {
				key: g.key,
				title: marketTitle(g.market),
				count: g.items.length,
				data: rows,
			};
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isGlobalSearch, displayedProducts]);

	const fetchProducts = async (nextPage = 1, replace = false) => {
		try {
			if (nextPage === 1) setLoading(true);
			else setIsFetchingMore(true);

			// Recompute the search mode here (not via the render memo) so it's
			// always correct at call time, e.g. when the filter modal's "Apply"
			// button calls this with the latest filters.
			const searchActive = String(filters.search || "").trim().length > 0;
			const globalSearch = !marketParam && !isMultiSearch && searchActive;

			// City is only needed for non-market fetches (main-store gate / global
			// search per-product filtering); skip the profile call inside a market.
			const city = marketParam ? "" : await getUserCity();

			// Main-store (admin) items are only shown to users in a city the admin
			// serves. This gate applies to plain main-store browsing only. It does
			// NOT apply when browsing a specific market (own city rule) NOR to a
			// global search: a global search must still surface MARKET items that
			// serve the user's city even when the admin doesn't, so we filter those
			// per-product below instead of bailing out here.
			if (!marketParam && !globalSearch) {
				if (!(await isCityServedByAdmin(city))) {
					if (replace || nextPage === 1) setProducts([]);
					setHasNextPage(false);
					return;
				}
			}

			// Admin serving cities, needed to gate main-store items in a global
			// search (market items are gated by their own market's cities).
			const adminCities = globalSearch ? await getAdminCities() : [];

			const query: ProductQuery = {};
			query.page = nextPage;
			// Markets and global searches load everything in one call so the
			// chips / grouping have the full list.
			query.limit = marketParam || globalSearch ? 200 : 12;

			// include filters (NO MANUAL ENCODING)
			if (filters.search) query.search = filters.search;
			if (filters.subcategory) query.subcategory = filters.subcategory;

			if (filters.sortBy) {
				query.sortBy = filters.sortBy;
				query.sortOrder = filters.sortOrder;
			}

			if (filters.priceRange) query.priceRange = filters.priceRange;
			if (filters.stockLevel) query.stockLevel = filters.stockLevel;

			// Category can come from the URL (top chips) or the filter modal. It is
			// sent server-side for main-store/global browsing; the market view
			// filters by category client-side (see displayedProducts).
			const effectiveCategory = categoryParam || filters.category;
			if (!marketParam && effectiveCategory) query.category = effectiveCategory;

			// include market filter (mobile: filter products by a specific market)
			if (marketParam) {
				query.market = marketParam;
			} else if (!globalSearch) {
				// Plain main-store browsing: show main-store items only. Market
				// products are browsed by tapping a market on the home page.
				query.market = "none";
			}
			// Global search: omit the market param entirely so the API returns BOTH
			// main-store AND every market's matching products.

			// ✅ If discount from URL OR filter toggle
			let json;
			if (discountParam === "true" || filters.discount === true) {
				query.minDiscount = filters.minDiscount || 1;
				json = await ProductService.getDiscounted(query);
			} else {
				json = await ProductService.list(query);
			}

			let newData = Array.isArray(json.data) ? json.data : [];

			// CITY RULE for a global search: drop items the user's city can't see.
			// Market products are checked against their own market's cities;
			// main-store products (market === null) against the admin's cities.
			// Guests (no city) keep everything.
			if (globalSearch && city) {
				newData = newData.filter((p) =>
					p?.market
						? entityServesCity(p.market, city)
						: cityMatches(adminCities, city)
				);
			}

			setProducts((prev) => {
				if (replace) return newData;
				const existingIds = new Set(prev.map((p) => p._id));
				const uniqueNewData = newData.filter((p) => !existingIds.has(p._id));
				return [...prev, ...uniqueNewData];
			});
			// Markets and global searches load everything at once, so disable
			// infinite scroll there.
			setHasNextPage(
				marketParam || globalSearch
					? false
					: (json.pagination as { hasNextPage?: boolean })?.hasNextPage ??
							false
			);
		} catch (err) {
			console.error("fetchProducts error:", err);
		} finally {
			setLoading(false);
			setIsFetchingMore(false);
		}
	};

	// Voice / multi-item search. For every recognised item we look it up three
	// smart ways and merge the de-duplicated results, so the grid shows everything
	// related to what the shopper asked for (e.g. "hotdog" surfaces hot-dog
	// products PLUS any matching category / subcategory):
	//   1. a product search on the item (and its no-space variant, so "hot dog"
	//      also finds "hotdog"),
	//   2. products from any CATEGORY whose name relates to the item,
	//   3. products from any SUBCATEGORY whose name relates to the item.
	const fetchMultiSearch = async (terms: string[]) => {
		try {
			setLoading(true);

			// Voice/multi search fetches BOTH main-store and market products (no
			// market=none), so we must apply the city rule ourselves: a logged-in
			// user only sees market items whose market serves their city, and
			// main-store items only when the admin serves their city. Guests (no
			// city) and unconfigured cities still see everything.
			const [city, adminCities] = await Promise.all([
				getUserCity(),
				getAdminCities(),
			]);

			// We match against the category/subcategory taxonomy. It may not be in
			// state yet when arriving via a voice deep-link, so load it if missing.
			let cats = categories;
			let subs = subcategories;
			try {
				if (!cats.length) {
					const j = await CategoryService.list();
					cats = Array.isArray(j?.data) ? j.data : [];
				}
				if (!subs.length) {
					const j = await CategoryService.subcategories();
					subs = Array.isArray(j?.data) ? j.data : [];
				}
			} catch (e) {
				console.warn("multi-search taxonomy load failed:", (e as Error)?.message);
			}

			// Lowercased text of a (possibly translatable) name, for fuzzy matching.
			const toText = (val: unknown): string => {
				if (!val) return "";
				if (typeof val === "string") return val.toLowerCase();
				if (typeof val === "object")
					return Object.values(val as Record<string, unknown>)
						.filter((v) => typeof v === "string")
						.join(" ")
						.toLowerCase();
				return String(val).toLowerCase();
			};
			// Split a (translatable) name into lowercase words for matching.
			const STOPWORDS = new Set([
				"and", "the", "with", "for", "of", "to", "in", "on", "a", "an",
			]);
			const wordsOf = (val: unknown): string[] =>
				toText(val)
					.split(/[^a-z0-9\u0600-\u06ff]+/i)
					.filter((w) => w && !STOPWORDS.has(w));

			// True only when a WHOLE word is shared (with light plural tolerance),
			// so "ham" no longer matches "shampoo" and drags in cleaning items.
			const shareWord = (nameWords: string[], termWords: string[]) =>
				termWords.some((tw) => {
					if (tw.length < 3) return false;
					return nameWords.some((nw) => {
						if (nw === tw) return true;
						const short = nw.length <= tw.length ? nw : tw;
						const long = nw.length <= tw.length ? tw : nw;
						return (
							short.length >= 3 &&
							long.startsWith(short) &&
							long.length - short.length <= 3
						);
					});
				});

			// Does a category / subcategory name share a real word with the term?
			const relates = (nameText: string, words: string[]) =>
				shareWord(wordsOf(nameText), words);

			// All the text we can see for a product (name + category + subcategory +
			// tags), used to judge whether it really matches what was asked.
			const productText = (p: Record<string, unknown>) => {
				const sub = p?.subcategory as { name?: unknown } | undefined;
				const parent = p?.parentCategory as { name?: unknown } | undefined;
				const cat = p?.category as { name?: unknown } | undefined;
				return [
					p?.name,
					sub?.name,
					parent?.name,
					cat?.name,
					Array.isArray(p?.tags) ? (p.tags as unknown[]).join(" ") : p?.tags,
				]
					.map(toText)
					.filter(Boolean)
					.join(" ");
			};

			// One product-list fetch for a given query param (search/category/sub).
			// NOTE: we intentionally do NOT send market=none here. Omitting the
			// market filter makes the API return BOTH main-store AND market/mart
			// products, so voice search also finds items that live in a market's
			// own catalogue (e.g. a mart product titled "ketchup abc").
			const fetchList = async (
				key: "search" | "category" | "subcategory",
				value: string,
			): Promise<Product[]> => {
				try {
					const query: ProductQuery = { limit: 20 };
					query[key] = value;
					const json = await ProductService.list(query);
					return Array.isArray(json.data) ? json.data : [];
				} catch (e) {
					console.warn(
						"multi-search fetch failed:",
						key,
						value,
						(e as Error)?.message,
					);
					return [];
				}
			};

			const requests: Promise<Product[]>[] = [];
			const usedCats = new Set<string>();
			const usedSubs = new Set<string>();

			terms.forEach((term) => {
				const clean = String(term || "").toLowerCase().trim();
				if (!clean) return;
				const words = clean.split(/\s+/).filter(Boolean);

				// 1) direct product search (full phrase + no-space variant).
				requests.push(fetchList("search", clean));
				const noSpace = clean.replace(/\s+/g, "");
				if (noSpace && noSpace !== clean)
					requests.push(fetchList("search", noSpace));

				// 2) related categories (capped so results stay relevant & fast).
				cats.forEach((cat) => {
					if (typeof cat?.name !== "string") return;
					if (usedCats.size >= 4 || usedCats.has(cat.name)) return;
					if (relates(toText(cat.name), words)) {
						usedCats.add(cat.name);
						requests.push(fetchList("category", cat.name));
					}
				});

				// 3) related subcategories.
				subs.forEach((sub) => {
					if (typeof sub?.name !== "string") return;
					if (usedSubs.size >= 6 || usedSubs.has(sub.name)) return;
					if (relates(toText(sub.name), words)) {
						usedSubs.add(sub.name);
						requests.push(fetchList("subcategory", sub.name));
					}
				});
			});

			const lists = await Promise.all(requests);

			// Merge, keeping the directly-searched items first (requests were queued
			// in that order) and dropping duplicates by id.
			const seen = new Set<string>();
			const merged: Product[] = [];
			lists.flat().forEach((p) => {
				if (p && p._id && !seen.has(p._id)) {
					seen.add(p._id);
					merged.push(p);
				}
			});

			// SMART RELEVANCE FILTER — keep results on-topic for ANY department:
			// keep only products that truly share a word with what was asked
			// (whole-word, so "ham" never pulls "shampoo"). Works for food, cleaning,
			// household, office, etc. because relevance is by words, not by category.
			// If the strict pass empties the grid (e.g. brand-only names) we fall back
			// to the merged list so the shopper still sees something.
			const allTermWords: string[] = [];
			terms.forEach((term) =>
				wordsOf(term).forEach((w) => allTermWords.push(w))
			);
			const relevant = merged.filter((p) =>
				shareWord(
					wordsOf(productText(p as unknown as Record<string, unknown>)),
					allTermWords,
				)
			);
			const finalProducts = relevant.length ? relevant : merged;

			// CITY RULE: drop items the user's city can't see. Market products are
			// checked against their own market's cities; main-store products
			// (market === null) against the admin's serving cities. Guests (no
			// city) keep everything.
			const cityFiltered = city
				? finalProducts.filter((p) =>
						p?.market
							? entityServesCity(p.market, city)
							: cityMatches(adminCities, city)
				  )
				: finalProducts;

			// Default sort: highest price first (voice/multi-search merges several
			// independent fetches, so it can't rely on the API's own sort param).
			const sorted = [...cityFiltered].sort(
				(a, b) =>
					(parseFloat(String(b?.price)) || 0) -
					(parseFloat(String(a?.price)) || 0)
			);

			setProducts(sorted);
			setHasNextPage(false); // all results are loaded in one shot
		} catch (err) {
			console.error("fetchMultiSearch error:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setPage(1);
		if (isMultiSearch) {
			fetchMultiSearch(searchTerms);
		} else {
			fetchProducts(1, true); // replace = true so it starts fresh
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [categoryParam, discountParam, marketParam, termsParam]);

	// ✅ Check login & fetch user
	useEffect(() => {
		const checkLogin = async () => {
			const userData = await AsyncStorage.getItem("userData");
			const guest = await AsyncStorage.getItem("guest");

			if (!userData && !guest) {
				router.replace("/start");
			} else {
				try {
					const res = await AuthService.me();
					if (res?.success) {
						const data = res.data as unknown as { user?: User } | User;
						setUser((data as { user?: User })?.user ?? (data as User));
					} else {
						console.error("❌ Failed to fetch user");
					}
				} catch (err) {
					console.error("🔥 Network/Fetch error:", err);
				}
				setLoading(false);
			}
		};
		checkLogin();
	}, []);

	const loadMore = () => {
		if (!hasNextPage || isFetchingMore) return;

		const nextPage = page + 1;
		setPage(nextPage);
		fetchProducts(nextPage, false); // append instead of replace
	};

	// Remove one chip from a voice/multi-item search and re-run with the rest.
	const removeTerm = (term: string) => {
		const next = searchTerms.filter((x) => x !== term);
		router.setParams({
			terms: next.map((x) => encodeURIComponent(x)).join(","),
		});
	};

	const renderProduct = ({ item }: { item: Product }) => {
		const basePrice = item.price || 0;
		const discountPercent = item.discount || 0;
		const taxPercent = item.tax || 0;
		const bottleRefund = item.bottlerefund || 0;

		const discountAmount = (basePrice * discountPercent) / 100;
		const priceAfterDiscount = basePrice - discountAmount;
		const taxAmount = (priceAfterDiscount * taxPercent) / 100;
		const finalPrice = priceAfterDiscount;

		const isQtyVisible = showQty[item._id] || false;

		return (
			<View key={item._id} style={styles.card}>
				<TouchableOpacity
					onPress={() => router.push(`/product/${item._id}`)}
					activeOpacity={0.8}
				>
					<View style={styles.imageWrapper}>
						<Image
							source={{ uri: item.picture }}
							style={styles.image}
							resizeMode="contain"
						/>
						{item.stock === 0 && (
							<View style={styles.outOfStockOverlay}>
								<Text style={styles.outOfStockText}>{t("out")}</Text>
							</View>
						)}

						{discountPercent > 0 && (
							<View style={styles.discountBadge}>
								<Text style={styles.discountText}>-{discountPercent}%</Text>
							</View>
						)}
					</View>

					<Text style={styles.name} numberOfLines={2}>
						{td(item.name)}
					</Text>

					{basePrice !== finalPrice ? (
						<View style={styles.priceRow}>
							<Text style={styles.basePrice}>${basePrice.toFixed(2)}</Text>
							<Text style={styles.finalPrice}>${finalPrice.toFixed(2)}</Text>
						</View>
					) : (
						<View style={styles.priceRow}>
							<Text style={styles.newPrice}>${finalPrice.toFixed(2)}</Text>
						</View>
					)}
				</TouchableOpacity>

				{/* Add to Cart / Quantity Selector */}
				{item.stock > 0 && (
					<View style={styles.qtyRow}>
						{isQtyVisible ? (
							<View style={styles.qtyContainer}>
								<TouchableOpacity
									onPress={() => decreaseQty(item)}
									style={styles.qtyBtn}
								>
									<Text style={styles.qtyText}>-</Text>
								</TouchableOpacity>

								<Text style={styles.qtyValue}>{quantities[item._id] || 1}</Text>

								<TouchableOpacity
									onPress={() => increaseQty(item)}
									style={styles.qtyBtn}
								>
									<Text style={styles.qtyText}>+</Text>
								</TouchableOpacity>
							</View>
						) : (
							<TouchableOpacity
								onPress={() => increaseQty(item)}
								style={[
									styles.qtyBtn,
									{ paddingHorizontal: 12, paddingVertical: 6 },
								]}
							>
								<Feather name="shopping-cart" size={20} color="#fff" />
							</TouchableOpacity>
						)}
					</View>
				)}
			</View>
		);
	};

	if (loading) {
		return (
			<View style={styles.loader}>
				<ActivityIndicator size="large" color="#f4bb26" />
			</View>
		);
	}

	return (
		<SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
			<View style={styles.container}>
				{/* Back arrow + Categories */}
				<View style={styles.categoryHeader}>
					<TouchableOpacity
						onPress={() => router.back()}
						style={styles.backButton}
					>
						<Feather name="chevron-left" size={24} color="#000000" />
					</TouchableOpacity>

					{marketParam ? (
						marketCats.length > 0 ? (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.categoryBar}
								contentContainerStyle={{ alignItems: "center" }}
							>
								{/* All button */}
								<TouchableOpacity
									style={[
										styles.categoryBtn,
										!marketCatId && { backgroundColor: "#f4bb26" },
									]}
									onPress={() => {
										setMarketCatId("");
										setMarketSubId("");
									}}
								>
									<Text
										style={[
											styles.categoryText,
											!marketCatId && { color: "#000", fontWeight: "700" },
										]}
									>
										{t("all")}
									</Text>
								</TouchableOpacity>

								{/* This market's own categories */}
								{marketCats.map((cat) => {
									const isSelected = marketCatId === String(cat._id);
									return (
										<TouchableOpacity
											key={cat._id}
											style={[
												styles.categoryBtn,
												isSelected && { backgroundColor: "#f4bb26" },
											]}
											onPress={() => {
												setMarketCatId(String(cat._id));
												setMarketSubId("");
											}}
										>
											<Text
												style={[
													styles.categoryText,
													isSelected && { color: "#000", fontWeight: "700" },
												]}
											>
												{td(cat.name)}
											</Text>
										</TouchableOpacity>
									);
								})}
							</ScrollView>
						) : (
							<View style={{ flex: 1, paddingHorizontal: 10 }}>
								<Text
									numberOfLines={1}
									style={{ fontSize: 18, fontWeight: "700", color: "#000" }}
								>
									{marketNameParam || t("market")}
								</Text>
							</View>
						)
					) : discountParam !== "true" && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.categoryBar}
							contentContainerStyle={{ alignItems: "center" }}
						>
							{/* All button */}
							<TouchableOpacity
								style={[
									styles.categoryBtn,
									!categoryParam &&
										discountParam !== "true" && {
											backgroundColor: "#f4bb26",
										},
								]}
								onPress={() => router.push("/shop")}
							>
								<Text
									style={[
										styles.categoryText,
										!categoryParam &&
											discountParam !== "true" && {
												color: "#000",
												fontWeight: "700",
											},
									]}
								>
									{t("all")}
								</Text>
							</TouchableOpacity>

							{/* Dynamic categories */}
							{categories.map((cat) => {
								const isSelected = categoryParam === cat.name;
								return (
									<TouchableOpacity
										key={cat._id}
										style={[
											styles.categoryBtn,
											isSelected && { backgroundColor: "#f4bb26" },
										]}
										onPress={() =>
											router.push(
												`/shop1?category=${encodeURIComponent(cat.name)}`
											)
										}
									>
										<Text
											style={[
												styles.categoryText,
												isSelected && { color: "#000", fontWeight: "700" },
											]}
										>
											{td(cat.name)}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					)}

					{discountParam !== "true" && (
						<TouchableOpacity
							style={[styles.categoryBtn, { backgroundColor: "#ddd" }]}
							onPress={() => setFilterOpen(true)}
						>
							<Feather name="sliders" size={18} color="#000" />
						</TouchableOpacity>
					)}
				</View>

				{/* Market subcategory row: the selected category's subcategories */}
				{marketParam &&
					selectedMarketCat &&
					(selectedMarketCat.subcategories || []).length > 0 && (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							style={styles.subcategoryBar}
							contentContainerStyle={{
								alignItems: "center",
								paddingHorizontal: 8,
								paddingVertical: 8,
							}}
						>
							<TouchableOpacity
								style={[
									styles.subcategoryBtn,
									!marketSubId && styles.subcategoryBtnActive,
								]}
								onPress={() => setMarketSubId("")}
							>
								<Text
									style={[
										styles.subcategoryText,
										!marketSubId && { color: "#000", fontWeight: "700" },
									]}
								>
									{t("all")}
								</Text>
							</TouchableOpacity>

							{(selectedMarketCat.subcategories || []).map((sub) => {
								const isSel = marketSubId === String(sub._id);
								return (
									<TouchableOpacity
										key={sub._id}
										style={[
											styles.subcategoryBtn,
											isSel && styles.subcategoryBtnActive,
										]}
										onPress={() => setMarketSubId(String(sub._id))}
									>
										<Text
											style={[
												styles.subcategoryText,
												isSel && { color: "#000", fontWeight: "700" },
											]}
									>
										{td(sub.name)}
									</Text>
								</TouchableOpacity>
							);
						})}
						</ScrollView>
					)}

				{/* Products Grid */}
				{isGlobalSearch ? (
					/* Global search: group results by market, each under its own
					   header, so markets don't get condensed together. */
					<SectionList
						sections={searchSections}
						contentContainerStyle={{ paddingBottom: 120 }}
						keyExtractor={(row, index) =>
							`row-${row[0]?._id || "x"}-${index}`
						}
						stickySectionHeadersEnabled={false}
						renderSectionHeader={({ section }) => (
							<View style={styles.sectionHeader}>
								<Feather name="shopping-bag" size={15} color="#e0a106" />
								<Text style={styles.sectionHeaderText} numberOfLines={1}>
									{section.title}
								</Text>
								<Text style={styles.sectionHeaderCount}>
									({section.count})
								</Text>
							</View>
						)}
						renderItem={({ item: row }) => (
							<View style={styles.searchRow}>
								{row.map((p) => renderProduct({ item: p }))}
							</View>
						)}
						ListEmptyComponent={
							!loading ? (
								<View style={{ paddingVertical: 40, alignItems: "center" }}>
									<Text style={{ color: "#777", fontSize: 14 }}>
										{t("searchNoResults")}
									</Text>
								</View>
							) : null
						}
					/>
				) : (
					<FlatList
						contentContainerStyle={{ paddingBottom: 120 }}
						data={displayedProducts}
						keyExtractor={(item) => item._id}
						renderItem={renderProduct}
						numColumns={3} // <-- 3 items per row
						onEndReached={marketParam || isMultiSearch ? undefined : loadMore}
						onEndReachedThreshold={0.3}
						ListHeaderComponent={
							isMultiSearch ? (
								<View style={styles.voiceHeader}>
									<View style={styles.voiceHeaderTitleRow}>
										<Feather name="mic" size={16} color="#e0a106" />
										<Text style={styles.voiceHeaderTitle}>
											{t("voiceResultsTitle")}
										</Text>
									</View>
									<View style={styles.voiceChipsRow}>
										{searchTerms.map((term) => (
											<View key={term} style={styles.voiceChip}>
												<Text style={styles.voiceChipText}>{term}</Text>
												<TouchableOpacity
													onPress={() => removeTerm(term)}
													hitSlop={8}
												>
													<Feather name="x" size={14} color="#8a6d10" />
												</TouchableOpacity>
											</View>
										))}
									</View>
								</View>
							) : null
						}
						ListEmptyComponent={
							!loading ? (
								<View style={{ paddingVertical: 40, alignItems: "center" }}>
									<Text style={{ color: "#777", fontSize: 14 }}>
										{isMultiSearch
											? t("voiceNoResults")
											: t("noProductsInCategory")}
									</Text>
								</View>
							) : null
						}
						ListFooterComponent={
							isFetchingMore ? (
								<ActivityIndicator size="small" color="#f4bb26" />
							) : null
						}
					/>
				)}

				{/* ✅ Filter Overlay */}
				{filterOpen && (
					<View style={[styles.filterOverlay, { left: width * 0.3 }]}>
						{/* Close button */}
						<TouchableOpacity
							style={styles.closeBtn}
							onPress={() => setFilterOpen(false)}
						>
							<Feather name="x" size={28} color="#000" />
						</TouchableOpacity>

						<ScrollView contentContainerStyle={{ padding: 20 }}>
							<Text style={styles.title}>{t("filterProducts")}</Text>

							{/* Search Field */}
							<TextInput
								placeholder={t("searchPlaceholder")}
								value={filters.search}
								onChangeText={(v) => setFilters((p) => ({ ...p, search: v }))}
								style={styles.input}
							/>

							{/* Category + Subcategory pickers (main store / global search;
							   a specific market uses its own category/subcategory chips
							   above). These apply to search results too, which now
							   include market products. */}
							{!marketParam && (
								<>
									<Text style={{ marginTop: 20, marginBottom: 5 }}>
										{t("category")}
									</Text>
									<View style={styles.input}>
										<Picker
											selectedValue={filters.category}
											onValueChange={(v) =>
												setFilters((p) => ({ ...p, category: v }))
											}
										>
											<Picker.Item label={t("allCategories")} value="" />
											{categories.map((cat) => (
												<Picker.Item
													key={cat._id}
													label={td(cat.name)}
													value={cat.name}
												/>
											))}
										</Picker>
									</View>

									<Text style={{ marginTop: 20, marginBottom: 5 }}>
										{t("subcategory")}
									</Text>
									<View style={styles.input}>
										<Picker
											selectedValue={filters.subcategory}
											onValueChange={(v) =>
												setFilters((p) => ({ ...p, subcategory: v }))
											}
										>
											<Picker.Item label={t("subcategory")} value="" />
											{subcategories.map((sub) => (
												<Picker.Item
													key={sub._id}
													label={td(sub.name)}
													value={sub.name}
												/>
											))}
										</Picker>
									</View>
								</>
							)}

							{/* Sort Dropdown */}
							<Text style={{ marginTop: 20, marginBottom: 5 }}>
								{t("sortBy")}
							</Text>
							<View style={styles.input}>
								<Picker
									selectedValue={`${filters.sortBy}_${filters.sortOrder}`}
									onValueChange={(v) => {
										const [sortBy, sortOrder] = v.split("_");
										setFilters((p) => ({ ...p, sortBy, sortOrder: sortOrder as "asc" | "desc" }));
									}}
								>
									<Picker.Item label={t("sortPriceLowHigh")} value="price_asc" />
									<Picker.Item label={t("sortPriceHighLow")} value="price_desc" />
									<Picker.Item label={t("sortNameAZ")} value="name_asc" />
									<Picker.Item label={t("sortNameZA")} value="name_desc" />
									<Picker.Item label={t("sortNewest")} value="createdAt_desc" />
									<Picker.Item label={t("sortOldest")} value="createdAt_asc" />
								</Picker>
							</View>

							{/* Discount Toggle */}
							<TouchableOpacity
								onPress={() =>
									setFilters((p) => ({ ...p, discount: !p.discount }))
								}
								style={styles.checkboxRow}
							>
								<Text style={{ color: "#000" }}>{t("onlyDiscounted")}</Text>
								<View
									style={[
										styles.checkbox,
										filters.discount && styles.checkboxActive,
									]}
								/>
							</TouchableOpacity>

							{/* Price Range Picker */}
							<Text style={{ marginTop: 20, marginBottom: 5 }}>
								{t("priceRange")}
							</Text>
							<View style={styles.input}>
								<Picker
									selectedValue={filters.priceRange}
									onValueChange={(v) =>
										setFilters((p) => ({ ...p, priceRange: v }))
									}
								>
									<Picker.Item label={t("allPrices")} value="" />
									<Picker.Item label={t("price1to20")} value="1-20" />
									<Picker.Item label={t("price21to50")} value="21-50" />
									<Picker.Item label={t("price51to100")} value="51-100" />
									<Picker.Item label={t("price101to200")} value="101-200" />
									<Picker.Item label={t("price201plus")} value="201-10000" />
								</Picker>
							</View>

							{/* Apply Filters Button */}
							<TouchableOpacity
								style={styles.button}
								onPress={() => {
									setFilterOpen(false);
									setPage(1);
									fetchProducts(1, true); // replace products with new filter results
								}}
							>
								<Text style={styles.buttonText}>{t("applyFilter")}</Text>
							</TouchableOpacity>
						</ScrollView>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#FFFFFF" },
	voiceHeader: {
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: 4,
	},
	voiceHeaderTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		marginBottom: 8,
	},
	voiceHeaderTitle: {
		fontSize: 14,
		fontWeight: "700",
		color: "#333",
	},
	voiceChipsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	voiceChip: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: "#fff3d1",
		borderColor: "#f4bb26",
		borderWidth: 1,
		paddingVertical: 5,
		paddingHorizontal: 12,
		borderRadius: 16,
	},
	voiceChipText: {
		fontSize: 13,
		color: "#5f4a08",
		fontWeight: "600",
		textTransform: "capitalize",
	},
	searchRow: {
		flexDirection: "row",
	},
	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginHorizontal: 8,
		marginTop: 12,
		marginBottom: 4,
		backgroundColor: "#fff8e6",
		borderRadius: 8,
	},
	sectionHeaderText: {
		flexShrink: 1,
		fontSize: 15,
		fontWeight: "700",
		color: "#333",
	},
	sectionHeaderCount: {
		fontSize: 13,
		color: "#999",
		fontWeight: "500",
	},
	loader: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
	},
	categoryHeader: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
		paddingVertical: 6,
	},
	backButton: { marginRight: 6, padding: 4 },
	categoryBar: { flex: 1 },
	categoryBtn: {
		paddingVertical: 6,
		paddingHorizontal: 14,
		borderRadius: 20,
		marginRight: 10,
	},
	categoryText: { fontSize: 14, fontWeight: "500", color: "#000000" },
	subcategoryBar: {
		backgroundColor: "#fafafa",
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	subcategoryBtn: {
		paddingVertical: 5,
		paddingHorizontal: 12,
		borderRadius: 16,
		marginRight: 8,
		backgroundColor: "#eee",
	},
	subcategoryBtnActive: { backgroundColor: "#f4bb26" },
	subcategoryText: { fontSize: 13, fontWeight: "500", color: "#333" },
	grid: { padding: 10 },
	card: {
		width: ITEM_WIDTH,
		margin: 4, // smaller margin for 3 items per row
		backgroundColor: "#FFFFFF",
		padding: 8,
	},

	imageWrapper: {
		position: "relative",
		width: "100%",
		height: 150,
		marginBottom: 6,
	},
	image: { width: "100%", height: "100%" },

	discountBadge: {
		position: "absolute",
		top: 8,
		right: 8,
		backgroundColor: "#f4bb26",
		paddingHorizontal: 6,
		paddingVertical: 2,
		borderRadius: 4,
	},
	discountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
	name: { fontSize: 13, fontWeight: "500", marginBottom: 4, color: "#000000" },
	priceRow: { flexDirection: "row", alignItems: "center" },
	oldPrice: {
		textDecorationLine: "line-through",
		color: "#000000",
		marginRight: 6,
		fontSize: 13,
	},
	newPrice: { fontSize: 15, fontWeight: "700", color: "#000000" },
	basePrice: {
		textDecorationLine: "line-through",
		color: "#000000",
		marginRight: 6,
		fontSize: 13,
	},
	finalPrice: { fontSize: 15, fontWeight: "700", color: "red" },
	pagination: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
		backgroundColor: "#FFFFFF",
	},
	arrowButton: { padding: 6 },

	// Tabs
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#FFFFFF",
	},
	tabButton: { alignItems: "center", justifyContent: "center" },
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "red",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,1)",
		zIndex: 100,
		paddingTop: 50,
	},
	closeBtn: {
		position: "absolute",
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 200,
	},
	overlayContentProfile: {
		paddingTop: 100,
		paddingHorizontal: 20,
		alignItems: "flex-start",
	},
	overlayContentMenu: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	item: { fontSize: 16, marginVertical: 10, color: "#000" },
	row: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
	title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
	button: {
		backgroundColor: "#f4bb26",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginTop: 10,
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontWeight: "bold",
		fontSize: 16,
	},
	checkboxRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ccc",
		marginTop: 10,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderRadius: 4,
		borderWidth: 2,
		borderColor: "#000",
	},
	checkboxActive: {
		backgroundColor: "#f4bb26",
		borderColor: "#f4bb26",
	},
	qtyRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 6,
	},

	qtyContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},

	qtyBtn: {
		backgroundColor: "#f4bb26",
		borderRadius: 4,
		paddingHorizontal: 10,
		paddingVertical: 8,
		marginHorizontal: 4,
	},

	qtyText: { color: "#000", fontSize: 16, fontWeight: "700" },
	qtyValue: { marginHorizontal: 4, fontSize: 14, fontWeight: "700" },

	// ✅ Overlay on product image (transparent dark layer)
	outOfStockOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0,0,0,0.55)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},

	outOfStockText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
		textAlign: "center",
	},

	// ✅ Overlay for filter screen (white background)
	filterOverlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255,1)",
		zIndex: 100,
		paddingTop: 50,
	},

	input: {},

	safeArea: {
		flex: 1,
		backgroundColor: "#fff",
	},
});

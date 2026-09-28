import { useTranslation } from "@/contexts/TranslationContext";
import type { CartItem } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import { Alert, DeviceEventEmitter } from "react-native";

import type {
    AddResult,
    CartAction,
    CartContextValue,
    MarketRef,
    PriceDetails,
    ProductLike,
} from "@/types/contexts/CartContext.types";

export type { CartContextValue };

const CartContext = createContext<CartContextValue | undefined>(undefined);

// Key that identifies which "source" a product belongs to. The cart is only
// allowed to contain items from a single source at a time:
//   - A specific market  -> the market's _id
//   - The main admin store (no market) -> the constant "MAIN"
const MAIN_SOURCE = "MAIN";

// Normalize a `market` field (which may be null, an id string, or a populated
// object) into a stable source id. No market => the main admin store.
const getMarketSource = (market: MarketRef): string => {
  if (!market) return MAIN_SOURCE;
  if (typeof market === "string") return market;
  if (typeof market === "object" && market._id) return String(market._id);
  return MAIN_SOURCE;
};

const getProductSource = (product: { market?: MarketRef } | null | undefined): string =>
  getMarketSource(product?.market);

const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
  switch (action.type) {
    case "ADD_TO_CART":
      return action.payload;
    case "UPDATE_CART":
      return action.payload;
    case "ADD_ITEMS_TO_CART":
      return action.payload.reduce<CartItem[]>((updatedCart, item) => {
        const existingCartItemIndex = updatedCart.findIndex(
          (cartItem) => String(cartItem._id) === String(item._id)
        );

        // Cap a desired quantity at the product's available stock (when known).
        const capToStock = (
          desired: number,
          stockSource: { stock?: number | string | null },
        ): number => {
          const stock = Number(stockSource?.stock);
          if (Number.isFinite(stock) && stock > 0) {
            return Math.max(1, Math.min(desired, stock));
          }
          return Math.max(1, desired);
        };

        if (existingCartItemIndex !== -1) {
          // Item already in the cart (e.g. shared between two kitchens):
          // ADD the quantities together instead of overwriting, but never
          // exceed the available stock.
          return updatedCart.map((cartItem) => {
            if (String(cartItem._id) !== String(item._id)) return cartItem;
            const combined =
              (cartItem.quantity || 0) + (item.quantity || 1);
            return {
              ...cartItem,
              ...item,
              quantity: capToStock(combined, item.stock != null ? item : cartItem),
            };
          });
        }

        // New item: still respect stock for the initial quantity.
        return [
          ...updatedCart,
          { ...item, quantity: capToStock(item.quantity || 1, item) },
        ];
      }, state);
    case "REMOVE_FROM_CART":
      return state.filter((item) => item._id !== action.payload);
    case "CLEAR_CART":
      return [];
    default:
      return state;
  }
};

const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [subtotal, setSubtotal] = useState(0);
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  // Whether the current user is a guest (or not logged in). Guests are not
  // allowed to put items in the cart — they are sent to the login screen first.
  // We mirror the AsyncStorage flags in a ref so the (synchronous) add-to-cart
  // functions can check it without changing their callers. It is refreshed on
  // every navigation, so a login / guest change is picked up immediately.
  const isGuestRef = useRef(false);
  // Who the cart currently belongs to: the logged-in user's id, "guest", or
  // "none". A cart is personal, so whenever this changes — a login, a logout, a
  // switch to another account — the cart is emptied. null means "not read yet",
  // which is the app simply starting up and must NOT wipe the saved cart.
  const cartOwnerRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const guest = await AsyncStorage.getItem("guest");
        if (!active) return;
        isGuestRef.current = !userData || guest === "true";

        const userId = userData
          ? String(JSON.parse(userData)?.user?._id || "") || "user"
          : "";
        const owner = userId || (guest === "true" ? "guest" : "none");

        const previousOwner = cartOwnerRef.current;
        cartOwnerRef.current = owner;
        if (previousOwner && previousOwner !== owner) clearCart();
      } catch {
        // Keep the previous value if the read fails.
      }
    })();
    return () => {
      active = false;
    };
    // clearCart is stable for the life of the provider.
  }, [pathname]);

  // Guests cannot modify the cart: redirect them to the login screen and report
  // that nothing was added. Returns true when the user is allowed to continue.
  const requireAuth = () => {
    if (isGuestRef.current) {
      router.push("/start");
      return false;
    }
    return true;
  };

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedCart = await AsyncStorage.getItem("cart");
        if (storedCart) {
          dispatch({
            type: "ADD_TO_CART",
            payload: JSON.parse(storedCart || "[]"),
          });
        }
        // Legacy key: the kitchen "Go to Checkout" state is now derived from
        // the cart itself, so drop any map left behind by an older build.
        await AsyncStorage.removeItem("kitchenCheckoutIds");
      } catch (error) {
        console.error("Error loading cart data:", error);
      }
    };

    loadData();
  }, []);

  // Save cart whenever it changes
  useEffect(() => {
    AsyncStorage.setItem("cart", JSON.stringify(cart)).catch(console.error);
  }, [cart]);

  // Helper: Calculate price breakdown for one item
  const calculatePriceDetails = (item: Partial<CartItem>, quantity = 1): PriceDetails => {
    const basePrice = parseFloat(item.price as unknown as string) || 0;
    const discountPercent = parseFloat(item.discount as unknown as string) || 0;
    const taxPercent = parseFloat(item.tax as unknown as string) || 0;
    const bottleRefund = parseFloat(item.bottlerefund as unknown as string) || 0;

    // Step 1: discount
    const discountAmount = (basePrice * discountPercent) / 100;
    const afterDiscount = basePrice - discountAmount;

    // Step 2: tax
    const taxAmount = (afterDiscount * taxPercent) / 100;

    // Step 3: final price
    const finalPrice = (afterDiscount + taxAmount + bottleRefund) * quantity;

    return {
      basePrice,
      discountPercent,
      discountAmount,
      afterDiscount,
      taxPercent,
      taxAmount,
      bottleRefund,
      quantity,
      finalPrice,
    };
  };

  // Calculate subtotal whenever cart changes
  useEffect(() => {
    const newSubtotal = cart.reduce((acc, item) => {
      const quantity = item.quantity || 1;
      const { finalPrice } = calculatePriceDetails(item, quantity);
      return acc + finalPrice;
    }, 0);

    setSubtotal(newSubtotal);
  }, [cart]);

  // Source (market or main store) the current cart belongs to, or null if empty.
  const getCartSource = (): string | null => (cart.length ? getProductSource(cart[0]) : null);

  // Ask the user whether to discard the current cart and start a new one with
  // items from a different market/source.
  const confirmReplaceCart = (onConfirm: () => void) => {
    Alert.alert(
      t("differentMarketTitle"),
      t("differentMarketMessage"),
      [
        { text: t("cancel"), style: "cancel" },
        { text: t("restoreCart"), style: "destructive", onPress: onConfirm },
      ],
      { cancelable: true }
    );
  };

  // Add to cart
  const addToCart = (item: ProductLike, quantity = 1): AddResult => {
    // Block guests: send them to the login screen instead of adding to the cart.
    if (!requireAuth()) return { added: false, guest: true };

    const alreadyInCart = cart.some(
      (cartItem) => String(cartItem._id) === String(item._id)
    );
    const cartSource = getCartSource();
    const itemSource = getProductSource(item);

    // Block mixing sources: only allow one market (or the main store) per cart.
    if (cartSource && !alreadyInCart && itemSource !== cartSource) {
      confirmReplaceCart(() => {
        // Restore (empty) the cart, then add this item as the new cart.
        dispatch({ type: "ADD_TO_CART", payload: [{ ...item, quantity }] });
      });
      return { added: false, conflict: true };
    }

    const existingCartItemIndex = cart.findIndex(
      (cartItem) => String(cartItem._id) === String(item._id)
    );

    if (existingCartItemIndex !== -1) {
      // Update quantity
      dispatch({
        type: "UPDATE_CART",
        payload: cart.map((cartItem) =>
          String(cartItem._id) === String(item._id)
            ? { ...cartItem, quantity }
            : cartItem
        ),
      });
    } else {
      // Add new item with quantity
      dispatch({
        type: "ADD_TO_CART",
        payload: [...cart, { ...item, quantity }],
      });
    }

    return { added: true, conflict: false };
  };

  const addItemsToCart = (items: CartItem[]): AddResult => {
    if (!Array.isArray(items) || items.length === 0) {
      return { added: false, conflict: false };
    }

    // Block guests: send them to the login screen instead of adding to the cart.
    if (!requireAuth()) return { added: false, guest: true };

    const cartSource = getCartSource();
    // A batch (e.g. a repeated order) always comes from a single source.
    const batchSource = getProductSource(items[0]);

    if (cartSource && batchSource !== cartSource) {
      confirmReplaceCart(() => {
        // Restore the cart, then load it with the new batch of items.
        dispatch({ type: "ADD_TO_CART", payload: items });
      });
      return { added: false, conflict: true };
    }

    dispatch({
      type: "ADD_ITEMS_TO_CART",
      payload: items,
    });

    return { added: true, conflict: false };
  };

  // Remove from cart
  const removeFromCart = (itemId: string) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
  };

  // Clear cart
  const clearCart = async (): Promise<void> => {
    try {
      dispatch({ type: "CLEAR_CART" });
      await AsyncStorage.removeItem("cart");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  // The whole catalogue is city-scoped: the stores, markets and kitchens that
  // deliver to Beirut are not the ones that deliver to Tripoli, so a cart
  // filled in one city is meaningless in another. Whenever the shopper changes
  // their city — from the header pill, from edit-profile, from anywhere that
  // fires `userCityChanged` — the cart is emptied.
  //
  // The city the current cart belongs to is remembered (and persisted) so the
  // same event fired on app start, when the default city is resolved, never
  // wipes a cart that was filled in that very city.
  const cartCityRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;

    const sameCity = (a: string, b: string) =>
      a.trim().toLowerCase() === b.trim().toLowerCase();

    // Seed the baseline: the stored value, else the city on the saved profile.
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("cartCity");
        if (!active) return;
        if (stored) {
          cartCityRef.current = stored;
          return;
        }
        const raw = await AsyncStorage.getItem("userData");
        const city = raw ? JSON.parse(raw)?.user?.address?.city : null;
        if (!active || !city) return;
        cartCityRef.current = String(city);
        await AsyncStorage.setItem("cartCity", String(city));
      } catch {
        // No baseline -> the first city change is treated as "same city".
      }
    })();

    const sub = DeviceEventEmitter.addListener(
      "userCityChanged",
      (payload?: { city?: string }) => {
        const nextCity = String(payload?.city || "").trim();
        if (!nextCity) return;

        const previousCity = cartCityRef.current;
        cartCityRef.current = nextCity;
        AsyncStorage.setItem("cartCity", nextCity).catch(() => {});

        if (previousCity && !sameCity(previousCity, nextCity)) clearCart();
      },
    );

    return () => {
      active = false;
      sub.remove();
    };
    // clearCart is stable for the life of the provider.
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        addItemsToCart,
        removeFromCart,
        clearCart,
        subtotal,
        calculatePriceDetails, // expose helper for UI
        // Source the cart currently belongs to (a market _id or "MAIN"), or null
        // when the cart is empty. `cartMarket` is the populated market object
        // (or null for the main admin store) of the items in the cart.
        cartSource: getCartSource(),
        cartMarket: cart.length ? cart[0]?.market || null : null,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export { CartProvider, getMarketSource, getProductSource, MAIN_SOURCE, useCart };


import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePathname, useRouter } from "expo-router";
import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react";
import { Alert } from "react-native";

const CartContext = createContext();

// Key that identifies which "source" a product belongs to. The cart is only
// allowed to contain items from a single source at a time:
//   - A specific market  -> the market's _id
//   - The main admin store (no market) -> the constant "MAIN"
const MAIN_SOURCE = "MAIN";

// Normalize a `market` field (which may be null, an id string, or a populated
// object) into a stable source id. No market => the main admin store.
const getMarketSource = (market) => {
  if (!market) return MAIN_SOURCE;
  if (typeof market === "string") return market;
  if (typeof market === "object" && market._id) return String(market._id);
  return MAIN_SOURCE;
};

const getProductSource = (product) => getMarketSource(product?.market);

const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      return action.payload;
    case "UPDATE_CART":
      return action.payload;
    case "ADD_ITEMS_TO_CART":
      return action.payload.reduce((updatedCart, item) => {
        const existingCartItemIndex = updatedCart.findIndex(
          (cartItem) => String(cartItem._id) === String(item._id)
        );

        // Cap a desired quantity at the product's available stock (when known).
        const capToStock = (desired, stockSource) => {
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

const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [subtotal, setSubtotal] = useState(0);
  // Ids of kitchens the user added via "Add all to cart". Kept at app level (and
  // persisted) so the "Go to Checkout" button survives navigating away from the
  // home screen and back, while staying isolated per-kitchen.
  const [kitchenCheckoutIds, setKitchenCheckoutIds] = useState({});
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  // Whether the current user is a guest (or not logged in). Guests are not
  // allowed to put items in the cart — they are sent to the login screen first.
  // We mirror the AsyncStorage flags in a ref so the (synchronous) add-to-cart
  // functions can check it without changing their callers. It is refreshed on
  // every navigation, so a login / guest change is picked up immediately.
  const isGuestRef = useRef(false);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const userData = await AsyncStorage.getItem("userData");
        const guest = await AsyncStorage.getItem("guest");
        if (active) isGuestRef.current = !userData || guest === "true";
      } catch (e) {
        // Keep the previous value if the read fails.
      }
    })();
    return () => {
      active = false;
    };
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
        const storedKitchens = await AsyncStorage.getItem("kitchenCheckoutIds");
        if (storedKitchens) {
          setKitchenCheckoutIds(JSON.parse(storedKitchens || "{}"));
        }
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

  // Persist the kitchen-checkout map whenever it changes.
  useEffect(() => {
    AsyncStorage.setItem(
      "kitchenCheckoutIds",
      JSON.stringify(kitchenCheckoutIds)
    ).catch(console.error);
  }, [kitchenCheckoutIds]);

  // When the cart becomes empty (checkout, clear, etc.) reset every kitchen's
  // button back to "Add all to cart".
  useEffect(() => {
    if (cart.length === 0) {
      setKitchenCheckoutIds((prev) =>
        Object.keys(prev).length ? {} : prev
      );
    }
  }, [cart.length]);

  // Mark a specific kitchen as added (drives its Go-to-Checkout button).
  const markKitchenAdded = (kitchenId) => {
    if (!kitchenId) return;
    setKitchenCheckoutIds((prev) => ({ ...prev, [String(kitchenId)]: true }));
  };

  // Helper: Calculate price breakdown for one item
  const calculatePriceDetails = (item, quantity = 1) => {
    const basePrice = parseFloat(item.price) || 0;
    const discountPercent = parseFloat(item.discount) || 0;
    const taxPercent = parseFloat(item.tax) || 0;
    const bottleRefund = parseFloat(item.bottlerefund) || 0;

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
  const getCartSource = () => (cart.length ? getProductSource(cart[0]) : null);

  // Ask the user whether to discard the current cart and start a new one with
  // items from a different market/source.
  const confirmReplaceCart = (onConfirm) => {
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
  const addToCart = (item, quantity = 1) => {
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

  const addItemsToCart = (items) => {
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
  const removeFromCart = (itemId) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
  };

  // Clear cart
  const clearCart = async () => {
    try {
      dispatch({ type: "CLEAR_CART" });
      setKitchenCheckoutIds({});
      await AsyncStorage.removeItem("cart");
      await AsyncStorage.removeItem("kitchenCheckoutIds");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

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
        // Per-kitchen "added" tracking that drives the Go-to-Checkout button on
        // the home kitchen cards (persisted, survives navigation).
        kitchenCheckoutIds,
        markKitchenAdded,
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

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export { CartProvider, getMarketSource, getProductSource, MAIN_SOURCE, useCart };


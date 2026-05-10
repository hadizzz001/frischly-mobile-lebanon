import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useReducer, useState } from "react";

const CartContext = createContext();

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

        if (existingCartItemIndex !== -1) {
          return updatedCart.map((cartItem) =>
            String(cartItem._id) === String(item._id)
              ? { ...item, quantity: item.quantity }
              : cartItem
          );
        }

        return [...updatedCart, item];
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

  // Add to cart
  const addToCart = (item, quantity = 1) => {
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
  };

  const addItemsToCart = (items) => {
    dispatch({
      type: "ADD_ITEMS_TO_CART",
      payload: items,
    });
  };

  // Remove from cart
  const removeFromCart = (itemId) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: itemId });
  };

  // Clear cart
  const clearCart = async () => {
    try {
      dispatch({ type: "CLEAR_CART" });
      await AsyncStorage.removeItem("cart");
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

export { CartProvider, useCart };


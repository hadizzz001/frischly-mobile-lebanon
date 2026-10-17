// The cart's reducer, kept free of React Native imports so it can be unit
// tested on its own (it holds the quantity rules: merging, stock caps).

import type { CartItem } from "@/types";
import type { CartAction } from "@/types/contexts/CartContext.types";

export const cartReducer = (state: CartItem[], action: CartAction): CartItem[] => {
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

import type { CartItem, Product } from "@/types";

// A `market` field can arrive as null, an id string, or a populated object.
export type MarketRef = string | { _id?: string | number; name?: string; username?: string } | null | undefined;

export type ProductLike = Product & { quantity?: number };

export interface PriceDetails {
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  afterDiscount: number;
  taxPercent: number;
  taxAmount: number;
  bottleRefund: number;
  quantity: number;
  finalPrice: number;
}

export interface AddResult {
  added: boolean;
  guest?: boolean;
  conflict?: boolean;
}

export interface CartContextValue {
  cart: CartItem[];
  addToCart: (item: ProductLike, quantity?: number) => AddResult;
  addItemsToCart: (items: CartItem[]) => AddResult;
  removeFromCart: (itemId: string) => void;
  clearCart: () => Promise<void>;
  subtotal: number;
  calculatePriceDetails: (item: Partial<CartItem>, quantity?: number) => PriceDetails;
  kitchenCheckoutIds: Record<string, boolean>;
  markKitchenAdded: (kitchenId: string | number | null | undefined) => void;
  cartSource: string | null;
  cartMarket: MarketRef;
}

export type CartAction =
  | { type: "ADD_TO_CART"; payload: CartItem[] }
  | { type: "UPDATE_CART"; payload: CartItem[] }
  | { type: "ADD_ITEMS_TO_CART"; payload: CartItem[] }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "CLEAR_CART" };

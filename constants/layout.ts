// Centralized layout constants (screen size + every grid/card measurement that
// was previously computed inline at the top of a screen or component file).
//
// These values are read BOTH by the screen/component (for FlatList props such
// as numColumns / snapToInterval) and by its matching StyleSheet in `styles/`,
// so keeping a single definition here guarantees the two can never drift apart.
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

/** Device window size, measured once at startup. */
export const SCREEN_WIDTH: number = width;
export const SCREEN_HEIGHT: number = height;

// --- app/(tabs)/menu.tsx — categories grid -------------------------------
export const MENU_NUM_COLUMNS = 2;
export const MENU_ITEM_WIDTH = SCREEN_WIDTH / MENU_NUM_COLUMNS - 20;
export const MENU_ITEM_HEIGHT = 130;

// --- app/kitchen-category/[id].tsx ---------------------------------------
// Two cards per row: 12px outer padding on each side + 12px gutter between.
export const KITCHEN_CATEGORY_CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;

// --- app/shop.tsx --------------------------------------------------------
export const SHOP_ITEM_WIDTH = SCREEN_WIDTH / 3 - 12; // 3 items per row, adjust margin

// --- app/shop1.tsx -------------------------------------------------------
export const SHOP1_ITEM_WIDTH = SCREEN_WIDTH / 3 - 13; // three items per row with spacing

// --- components/CatSlider.tsx --------------------------------------------
export const CAT_SLIDER_ITEM_WIDTH = SCREEN_WIDTH / 4 - 15; // 4 items per row
export const CAT_SLIDER_ITEM_HEIGHT = 130;

// --- components/KitchenSlider.tsx ----------------------------------------
export const KITCHEN_SLIDER_ITEM_WIDTH = SCREEN_WIDTH / 2.4; // a bit wider than markets so the cards breathe

// --- components/MarketsSlider.tsx ----------------------------------------
// Keep ~3 markets visible while sliding one card at a time.
export const MARKETS_SLIDER_ITEM_SPACING = 10;
export const MARKETS_SLIDER_ITEM_WIDTH = SCREEN_WIDTH / 3 - 16;
export const MARKETS_SLIDER_SNAP_INTERVAL =
	MARKETS_SLIDER_ITEM_WIDTH + MARKETS_SLIDER_ITEM_SPACING;

// --- components/ProductList.tsx ------------------------------------------
export const PRODUCT_LIST_ITEM_WIDTH = SCREEN_WIDTH / 3 - 15;

// --- components/ProductSlide.tsx -----------------------------------------
export const PRODUCT_SLIDE_ITEM_WIDTH = SCREEN_WIDTH / 3 - 12; // Show exactly 3 per row
export const PRODUCT_SLIDE_ITEM_HEIGHT = 180;

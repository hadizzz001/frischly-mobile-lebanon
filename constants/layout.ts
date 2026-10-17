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

// --- Every scrolling page --------------------------------------------------
// Space left under the last thing on a page (link, card, button) so it never
// sits flush against the bottom nav or the phone's home indicator.
export const PAGE_END_SPACE = 64;

// --- components/AuthLayout.tsx -------------------------------------------
/** Height of the back-button / language-pill row on the auth header. */
export const AUTH_TOP_BAR_HEIGHT = 40;
/** Animated logo on the login header, kept smaller on short phones… */
export const AUTH_LOGO_VIDEO_SIZE = Math.round(Math.min(200, height * 0.24));
/** …and on the register header, whose long form needs the room. */
export const AUTH_LOGO_VIDEO_SIZE_COMPACT = Math.round(Math.min(160, height * 0.19));

// --- Shared 3-column product grid ----------------------------------------
// Every catalog grid (home, market home, shop, search, category, kitchens)
// shows 3 cards per row: 16px screen gutter on each side + an 8px gap between
// cards. GRID_GAP (16) stays the spacing for everything that isn't a grid row
// (carousel separators, search bar row).
export const GRID_GUTTER = 16;
export const GRID_GAP = 16;
export const PRODUCT_GRID_GAP = 8;
export const PRODUCT_GRID_COLUMNS = 3;
// Floored so three cards + two gaps never add up to a hair more than the row
// (a flex-wrap grid would then drop the third card to the next line).
export const PRODUCT_GRID_ITEM_WIDTH = Math.floor(
	(SCREEN_WIDTH - GRID_GUTTER * 2 - PRODUCT_GRID_GAP * (PRODUCT_GRID_COLUMNS - 1)) /
		PRODUCT_GRID_COLUMNS,
);

// --- app/(tabs)/menu.tsx — categories grid -------------------------------
// Same 3-per-row geometry as the product grid.
export const MENU_NUM_COLUMNS = PRODUCT_GRID_COLUMNS;
export const MENU_ITEM_WIDTH = PRODUCT_GRID_ITEM_WIDTH;
export const MENU_ITEM_HEIGHT = 130;

// --- app/kitchen-category/[id].tsx ---------------------------------------
export const KITCHEN_CATEGORY_CARD_WIDTH = PRODUCT_GRID_ITEM_WIDTH;

// --- app/shop.tsx --------------------------------------------------------
export const SHOP_ITEM_WIDTH = PRODUCT_GRID_ITEM_WIDTH;

// --- app/shop1.tsx -------------------------------------------------------
export const SHOP1_ITEM_WIDTH = PRODUCT_GRID_ITEM_WIDTH;

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
/** Shape of a store-logo tile; the logos are framed to it (LOGO_TILE_TRANSFORMATION). */
export const MARKETS_SLIDER_LOGO_ASPECT_RATIO = 5 / 4;

// --- components/ProductCard.tsx ------------------------------------------
// Product titles are cut to this many characters (a "..." is appended) so the
// name never pushes the price/add button out of a card in the grid.
export const PRODUCT_CARD_NAME_MAX_CHARS = 40;
// Cards narrower than this (the 3-per-row grid, the hot-sale row on small
// phones) switch to the compact layout: tighter padding, smaller type, USD on
// its own line — so the price is never cut off.
export const PRODUCT_CARD_COMPACT_MAX_WIDTH = 150;

// --- components/ProductList.tsx ------------------------------------------
export const PRODUCT_LIST_ITEM_WIDTH = PRODUCT_GRID_ITEM_WIDTH;

// --- components/ProductSlide.tsx -----------------------------------------
// Horizontal "hot sale" carousel: same geometry as the 3-column grid (card
// width + PRODUCT_GRID_GAP) so exactly 3 cards fill the row; the rest scroll.
export const PRODUCT_SLIDE_ITEM_WIDTH = PRODUCT_GRID_ITEM_WIDTH;
export const PRODUCT_SLIDE_ITEM_HEIGHT = 300; // room for the card's price/save lines + add button

// --- components/RepeatOrderButton.tsx ------------------------------------
/** Extra space a page keeps at its end while the floating "Order again" card shows. */
export const REPEAT_ORDER_FLOATING_SPACE = 96;

// --- components/Marquee.tsx ----------------------------------------------
/** Empty space between the two copies of a marquee's text. */
export const MARQUEE_GAP = 60;

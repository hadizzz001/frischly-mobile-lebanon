// Navigation-related constants: which routes hide chrome, which tabs are shown,
// and the bottom-nav icon colors. Previously declared inline inside the layout
// files and BottomNav.

// --- app/_layout.tsx -----------------------------------------------------
/** Hide the header on the login/register/checkout pages. */
const AUTH_ROUTES = [
	"/start",
	"/register",
	"/forgot-password",
	"/verify-reset-code",
	"/reset-password",
];
export const HIDE_HEADER_ROUTES = [...AUTH_ROUTES, "/checkout"];

/** Hide the bottom navigation on the pre-login auth screens. */
export const HIDE_BOTTOM_NAV_ROUTES = [...AUTH_ROUTES];

// Don't interrupt the login/register/checkout flows with the feedback prompt —
// it'll simply show up as soon as the shopper navigates away from one of these
// screens (the state persists, nothing is lost).
export const SUPPRESS_FEEDBACK_ROUTES = [...AUTH_ROUTES, "/checkout"];

// --- app/(tabs)/_layout.tsx ----------------------------------------------
/** Tabs to show. */
export const VISIBLE_TABS = ["index", "menu", "cart", "acc"];

// --- components/BottomNav.tsx --------------------------------------------
export const BOTTOM_NAV_ACTIVE_COLOR = "#111827";
export const BOTTOM_NAV_INACTIVE_COLOR = "#9CA3AF";

/** Mirrors the tabs declared in app/(tabs)/_layout.tsx */
export const BOTTOM_NAV_TABS = [
	{ key: "home", icon: "home", path: "/" },
	{ key: "menu", icon: "menu", path: "/menu" },
	{ key: "cart", icon: "shopping-cart", path: "/cart" },
	{ key: "acc", icon: "user", path: "/acc" },
];

// --- app/(tabs)/index.tsx ------------------------------------------------
// The home sections that decide whether this city has anything at all. When
// every one of them reports "empty", the home screen shows the
// "no store delivers here yet" message instead of the sections.
export const HOME_SECTION_KEYS = [
	"markets",
	"kitchens",
	"hotSale",
	"categories",
	"products",
] as const;

// --- app/market/[id].tsx -------------------------------------------------
// A market's home page is the home page minus the ticker and markets row; when
// every one of these sections comes back empty the market has nothing to sell
// yet and the page shows an empty state instead.
export const MARKET_SECTION_KEYS = [
	"kitchens",
	"hotSale",
	"categories",
	"products",
] as const;

// --- home / market section headers ---------------------------------------
/** Size + colour of the lucide icon that follows each section title. */
export const SECTION_TITLE_ICON_SIZE = 18;
export const SECTION_TITLE_ICON_COLOR = "#D97706";

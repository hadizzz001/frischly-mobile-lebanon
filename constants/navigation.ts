// Navigation-related constants: which routes hide chrome, which tabs are shown,
// and the bottom-nav icon colors. Previously declared inline inside the layout
// files and BottomNav.

// --- app/_layout.tsx -----------------------------------------------------
/** Hide the header on the login/register/checkout pages. */
export const HIDE_HEADER_ROUTES = ["/start", "/register", "/checkout"]; // add more paths if needed

/** Hide the bottom navigation on the pre-login auth screens. */
export const HIDE_BOTTOM_NAV_ROUTES = ["/start", "/register"];

// Don't interrupt the login/register/checkout flows with the feedback prompt —
// it'll simply show up as soon as the shopper navigates away from one of these
// screens (the state persists, nothing is lost).
export const SUPPRESS_FEEDBACK_ROUTES = ["/start", "/register", "/checkout"];

// --- app/(tabs)/_layout.tsx ----------------------------------------------
/** Tabs to show. */
export const VISIBLE_TABS = ["index", "menu", "cart", "acc"];

// --- components/BottomNav.tsx --------------------------------------------
export const BOTTOM_NAV_ACTIVE_COLOR = "#000000";
export const BOTTOM_NAV_INACTIVE_COLOR = "#f4bb26";

/** Mirrors the tabs declared in app/(tabs)/_layout.tsx */
export const BOTTOM_NAV_TABS = [
	{ key: "home", icon: "home", path: "/" },
	{ key: "menu", icon: "menu", path: "/menu" },
	{ key: "cart", icon: "shopping-cart", path: "/cart" },
	{ key: "acc", icon: "user", path: "/acc" },
];

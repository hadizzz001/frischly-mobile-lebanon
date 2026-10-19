// Brand-level constants (store name + branded media assets).

/** Display name of the main (non-market) store. */
export const MAIN_STORE_NAME = "FreshlyLB";

/**
 * Transparent logo cutout, rendered directly on the auth screens' curved amber
 * header (no enclosing square) and in the Appbar.
 */
export const LOGO_TRANSPARENT_URL =
	"https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1-removebg-preview_mwrt49.png";

/**
 * Branded animated logo played in the login / register header
 * (components/AuthLogoAnimation.tsx), shipped inside the app as an animated
 * WebP: 600×600 (200pt at @3x), 24 fps, the rest pose held 2 s before every
 * run (the first one too), looping forever. Made from the original Kling clip:
 * colours decoded with a fixed matrix (BT.601), background flattened to
 * AUTH_LOGO_BACKGROUND, wordmark held still, edge fades baked in. Every frame
 * is an opaque, unblended rectangle, so libwebp, Apple's decoder and Android
 * all draw it identically.
 */
export const AUTH_LOGO_ANIMATION: number = require("@/assets/images/auth-logo.webp");

/**
 * The animated logo's background, exactly: the header behind it is painted
 * with it, so the square image has no visible edge on any device. Lossy WebP
 * returns #F4BD0A unchanged (the clip's old #F3BD0A comes back as #F4BD0A).
 */
export const AUTH_LOGO_BACKGROUND = "#F4BD0A";

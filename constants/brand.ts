// Brand-level constants (store name + branded media assets).

/** Display name of the main (non-market) store. */
export const MAIN_STORE_NAME = "FreshlyLB";

/**
 * Transparent logo cutout, rendered directly on the auth screens' curved amber
 * header (no enclosing square) and in the Appbar.
 */
export const LOGO_TRANSPARENT_URL =
	"https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1-removebg-preview_mwrt49.png";

// Branded animated logo clip played in the login / register header
// (components/AuthLogoVideo.tsx).
export const AUTH_LOGO_VIDEO_URL =
	"https://res.cloudinary.com/dxefurewd/video/upload/q_auto,f_auto,w_1280,h_720,c_limit/v1783356666/kling_20260707_VIDEO_animate_fa_73_0_online-video-cutter.com_1_uxqfdj.mp4";

/**
 * The clip's own yellow, as decoded (#F1BD0A for most of it, #FBBF0D on its
 * first frames). The header behind the clip is painted with it, and
 * AuthLogoVideo fades the clip's edges into it, so the square video blends in
 * instead of showing as a box on the brand amber.
 */
export const AUTH_LOGO_VIDEO_BACKGROUND = "#F3BD0A";

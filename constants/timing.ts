// Centralized timing constants: polling intervals, animation/hold durations and
// recording limits that were previously declared inline in screens/components.
// All values are in milliseconds.

// --- app/order.tsx -------------------------------------------------------
// Poll the order list on this interval so status changes made from the admin
// dashboard (e.g. shipped -> delivered) show up automatically, without the
// shopper needing to pull-to-refresh or leave/reopen the screen.
export const ORDERS_POLL_MS = 10000;

// --- app/track/[id].tsx --------------------------------------------------
/** Refresh the rider's position every 12s. */
export const RIDER_TRACKING_POLL_MS = 12000;

// --- components/AuthLogoVideo.tsx ----------------------------------------
// How long to hold before the very first playback starts, and how long to
// pause again every time the clip finishes before it repeats — so it doesn't
// loop back-to-back with no breathing room.
export const AUTH_LOGO_HOLD_MS = 2000;

// --- components/MarketsSlider.tsx ----------------------------------------
// Auto-slide timing (one market per step).
export const MARKETS_SLIDER_STEP_DURATION_MS = 900; // ms to move one card
export const MARKETS_SLIDER_STEP_PAUSE_MS = 3200; // ms to wait between steps

// --- components/VoiceSearchSheet.tsx -------------------------------------
/** Ignore taps shorter than this so an accidental tap doesn't fire a request. */
export const VOICE_MIN_RECORD_MS = 500;
/** Hard cap on how long a single recording can run — auto-stops at 1 minute. */
export const VOICE_MAX_RECORD_MS = 60000;

// --- hooks/useBusyAction.ts + components/Cart.tsx ------------------------
// Cart actions (add, remove, +/-) are instant, so their spinner is held for
// this long to read as a deliberate step rather than a flicker.
export const ACTION_BUSY_MIN_MS = 350;

// --- components/Marquee.tsx (offers marquee) -----------------------------
// MILLISECONDS PER PIXEL — the scroll duration is derived from the text width,
// so the marquee keeps ONE speed whatever the offers happen to be (a fixed
// duration made short texts crawl and long ones race). Lower = faster.
export const TICKER_MS_PER_PIXEL = 9; // ~111 px/second

// --- components/SearchPlaceholder.tsx ------------------------------------
/** How long each search suggestion sits still before sliding up. */
export const SEARCH_PLACEHOLDER_HOLD_MS = 2200;
/** The slide itself. */
export const SEARCH_PLACEHOLDER_SLIDE_MS = 420;

// Tiny wrappers around expo-haptics so call sites stay one-liners and never
// throw on devices/simulators without a haptic engine.
import * as Haptics from "expo-haptics";

const safe = (fn: () => Promise<void>) => {
	fn().catch(() => {});
};

/** Light tap — cart +/- counters, chip toggles, list taps. */
export const tapLight = () =>
	safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

/** Medium tap — primary CTAs (add to cart, checkout). */
export const tapMedium = () =>
	safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));

/** Selection tick — segmented controls, pickers, filter chips. */
export const tapSelection = () => safe(() => Haptics.selectionAsync());

/** Success — voucher applied, order placed. */
export const notifySuccess = () =>
	safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** Warning — swipe-to-delete threshold, destructive confirm. */
export const notifyWarning = () =>
	safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

/** Error — invalid voucher, failed action. */
export const notifyError = () =>
	safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

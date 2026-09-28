import { DeviceEventEmitter } from "react-native";

// Whether the shopper's city has anything at all (a market, a kitchen, a
// product, a category). The home screen is the one place that knows — its
// sections each report what they ended up with — and other parts of the app
// (the floating voice-search button, for one) need to follow that answer, so
// it is published here rather than re-checked everywhere.

/** Emitted with the new boolean whenever the answer changes. */
export const STORE_AVAILABILITY_EVENT = "storeAvailabilityChanged";

// null until the home screen's sections have answered.
let hasStoreData: boolean | null = null;

/** Last known answer, available synchronously (null = not known yet). */
export const getStoreAvailability = (): boolean | null => hasStoreData;

export const setStoreAvailability = (hasData: boolean): void => {
	if (hasStoreData === hasData) return;
	hasStoreData = hasData;
	DeviceEventEmitter.emit(STORE_AVAILABILITY_EVENT, hasData);
};

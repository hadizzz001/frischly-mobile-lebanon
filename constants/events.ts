// Names of the app-wide DeviceEventEmitter events. Kept in one place so a typo
// on either side of an emit/listen pair is a compile-time import error.

/** Payload: string city (legacy) or { city, state?, location? }. */
export const USER_CITY_CHANGED = "userCityChanged";
/** Ask the header to open its city/region picker (e.g. from an empty state). */
export const OPEN_CITY_PICKER = "openCityPicker";
/** Open the global voice-search bottom sheet (e.g. from the header mic). */
export const OPEN_VOICE_SEARCH = "openVoiceSearch";
/** The local notification inbox / read state changed (bell badge refresh). */
export const INBOX_CHANGED = "notificationInboxChanged";

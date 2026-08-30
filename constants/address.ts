// ✅ Beirut fallback address used whenever the shopper denies the location
// permission (or GPS/reverse-geocoding fails). We never leave city/state/
// street empty, and the pin is dropped on Beirut city center.

export const DEFAULT_CITY = "Beirut";
export const DEFAULT_STATE = "Beirut";
export const DEFAULT_STREET = "Beirut";
export const DEFAULT_PIN = { latitude: 33.8938, longitude: 35.5018 };

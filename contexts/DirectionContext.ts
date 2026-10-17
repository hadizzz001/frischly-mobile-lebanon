import { createContext } from "react";

// true while the app is in Arabic. Provided by TranslationProvider and read by
// the RTL-aware Text/TextInput in utils/rtlText/. It is its own
// context (not the translation context) so every Text re-renders only when the
// language changes — not each time a background translation lands.
export const DirectionContext = createContext(false);

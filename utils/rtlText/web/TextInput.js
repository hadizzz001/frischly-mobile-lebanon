// Web only: Expo's Babel preset turns `import { TextInput } from "react-native"`
// into a direct import of react-native-web's TextInput, which metro.config.js
// redirects here (same Arabic default as on native, see ../withRTLDefault.js).
const TextInput = require("react-native-web/dist/exports/TextInput").default;
const { withRTLDefault } = require("../withRTLDefault");

module.exports = { __esModule: true, default: withRTLDefault(TextInput, "TextInput") };

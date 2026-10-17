// Web only: Expo's Babel preset turns `import { Text } from "react-native"`
// into a direct import of react-native-web's Text, which metro.config.js
// redirects here (same Arabic default as on native, see ../withRTLDefault.js).
const Text = require("react-native-web/dist/exports/Text").default;
const { withRTLDefault } = require("../withRTLDefault");

module.exports = { __esModule: true, default: withRTLDefault(Text, "Text") };

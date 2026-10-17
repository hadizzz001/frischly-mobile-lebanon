// react-native, as the app's own code sees it on Android/iOS (metro.config.js
// redirects every `import … from "react-native"` outside node_modules here):
// the same module, except Text and TextInput are right-aligned in Arabic
// (./withRTLDefault.js).
//
// Every other export is copied as its original property descriptor, so
// react-native's lazy getters stay lazy (several of them throw or warn when
// read, which is why `export * from "react-native"` cannot be used here).
const ReactNative = require("react-native"); // the real one: this file is not redirected
const { withRTLDefault } = require("./withRTLDefault");

const withRTL = {};
for (const key of Object.getOwnPropertyNames(ReactNative)) {
	if (key === "Text" || key === "TextInput") continue;
	Object.defineProperty(withRTL, key, Object.getOwnPropertyDescriptor(ReactNative, key));
}
withRTL.Text = withRTLDefault(ReactNative.Text, "Text");
withRTL.TextInput = withRTLDefault(ReactNative.TextInput, "TextInput");

module.exports = withRTL;

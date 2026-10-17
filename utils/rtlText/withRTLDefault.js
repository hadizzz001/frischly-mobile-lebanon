// Wraps React Native's Text or TextInput so that, while the app is in Arabic,
// it defaults to right-aligned text. English renders exactly as before.
//
// Why a wrapper: React Native 0.81 made Text and TextInput plain function
// components, so the old trick of patching their `render` (utils/rtl.ts before
// SDK 54) silently stopped working and Arabic text fell back to the left
// everywhere. metro.config.js hands the app's own code these wrapped
// components (see ./reactNative.js and ./web/).
//
// The default goes FIRST in the style array, so a component's own textAlign
// (e.g. "center") still wins. Only textAlign is set: each paragraph keeps its
// natural direction (Arabic reads right-to-left, a Latin product name or a
// price stays left-to-right) and is simply aligned to the right edge.
const React = require("react");
const { DirectionContext } = require("../../contexts/DirectionContext");

const RTL_DEFAULT = { textAlign: "right" };

function withRTLDefault(Component, displayName) {
	function RTLAware(props) {
		const isRTL = React.useContext(DirectionContext);
		if (!isRTL) return React.createElement(Component, props);
		return React.createElement(Component, { ...props, style: [RTL_DEFAULT, props.style] });
	}
	RTLAware.displayName = displayName;
	// Keep statics (e.g. TextInput.State).
	for (const key of Object.keys(Component)) {
		if (!(key in RTLAware)) RTLAware[key] = Component[key];
	}
	return RTLAware;
}

module.exports = { withRTLDefault };

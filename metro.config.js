// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Arabic text direction: the app's own code gets a Text/TextInput that is
// right-aligned in Arabic (utils/rtlText/). On Android/iOS that is a stand-in
// for the whole "react-native" module; on web Expo's Babel preset imports
// react-native-web's components one by one, so those two are redirected.
// Packages in node_modules, and the stand-ins themselves, get the real thing.
// Restart Metro with `-c` after changing this.
const RTL_TEXT = path.resolve(__dirname, 'utils/rtlText');
const RTL_MODULES = {
	'react-native': path.join(RTL_TEXT, 'reactNative.js'),
	'react-native-web/dist/exports/Text': path.join(RTL_TEXT, 'web/Text.js'),
	'react-native-web/dist/exports/TextInput': path.join(RTL_TEXT, 'web/TextInput.js'),
};
const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

config.resolver.resolveRequest = (context, moduleName, platform) => {
	const standIn = RTL_MODULES[moduleName];
	if (
		standIn &&
		!context.originModulePath.startsWith(RTL_TEXT + path.sep) &&
		!context.originModulePath.includes(NODE_MODULES)
	) {
		return { type: 'sourceFile', filePath: standIn };
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

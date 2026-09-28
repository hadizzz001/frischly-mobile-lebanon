/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#F59E0B";
const tintColorDark = "#F59E0B";

export const Colors = {
	light: {
		text: "#000000",
		background: "#FFFFFF",
		tint: tintColorLight,
		icon: "#000000",
		tabIconDefault: "#000000",
		tabIconSelected: tintColorLight,
	},
	dark: {
		text: "#FFFFFF",
		background: "#000000",
		tint: tintColorDark,
		icon: "#FFFFFF",
		tabIconDefault: "#FFFFFF",
		tabIconSelected: tintColorDark,
	},
};

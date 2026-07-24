module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // react-native-reanimated 4.x moved its worklet transform into the
    // separate `react-native-worklets` package. This plugin MUST be listed
    // last, otherwise any reanimated-based animation (used across the app,
    // e.g. bottom tabs, sliders, gesture-driven UI) can crash at runtime in
    // both Expo Go and dev/production builds.
    plugins: ["react-native-worklets/plugin"],
  };
};

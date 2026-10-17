import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: { flex: 1 },
	// The app shell (header, screens, bottom nav). Its own stacking context:
	// without one this plain view is flattened away, and the header's zIndex /
	// the nav's elevation then outrank the bottom-sheet portal that renders
	// after it — the sheet backdrop stopped under the header (header bright,
	// page dimmed) and the nav could cover a sheet's bottom.
	shell: { flex: 1, zIndex: 0 },
});

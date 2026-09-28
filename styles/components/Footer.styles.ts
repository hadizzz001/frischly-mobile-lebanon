import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	instagramBg: { backgroundColor: "#E1306C" },
	footer: { backgroundColor: "#F9FAFB", padding: 16, paddingBottom: 16 },
	iconRow: {
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap",
		marginBottom: 20,
	},
	payIcon: { width: 60, height: 40, margin: 5, resizeMode: "contain" },
	section: {
		marginVertical: 8,
		borderBottomWidth: 1,
		borderColor: "#ececec",
		paddingBottom: 10,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionTitle: { fontSize: 13, fontWeight: "400", color: "#8a8a8a" },
	sectionItems: { marginTop: 10 },
	linkText: { fontSize: 13, color: "#666", marginVertical: 4 },
	socialRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
		marginVertical: 20,
	},
	circle: {
		width: 40,
		height: 40,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	bottomText: {
		textAlign: "center",
		marginTop: 16,
		marginBottom: 0,
		fontSize: 11,
		color: "#6B7280",
	},
});

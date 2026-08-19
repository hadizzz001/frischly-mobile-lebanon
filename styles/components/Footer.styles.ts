import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	instagramBg: { backgroundColor: "#E1306C" },
	footer: { backgroundColor: "#f8f8f8", padding: 20, paddingBottom: 60 },
	iconRow: {
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap",
		marginBottom: 20,
	},
	payIcon: { width: 60, height: 40, margin: 5, resizeMode: "contain" },
	section: {
		marginVertical: 10,
		borderBottomWidth: 1,
		borderColor: "#ccc",
		paddingBottom: 10,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionTitle: { fontSize: 16, fontWeight: "bold" },
	sectionItems: { marginTop: 10 },
	linkText: { fontSize: 14, color: "#444", marginVertical: 4 },
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
		marginVertical: 20,
		fontSize: 12,
		color: "#666",
	},
});

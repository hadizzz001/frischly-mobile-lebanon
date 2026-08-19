import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "#fff" },
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
	},
	headerBtn: { width: 34, alignItems: "center", justifyContent: "center" },
	headerTitle: { fontSize: 16, fontWeight: "700", color: "#000" },
	footer: {
		flexDirection: "row",
		gap: 10,
		padding: 14,
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},
	secondaryBtn: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 8,
		flex: 1,
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
		paddingVertical: 13,
	},
	secondaryBtnText: { color: "#000", fontWeight: "600" },
	confirmBtn: {
		flex: 1,
		backgroundColor: "#f4bb26",
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 13,
	},
	confirmBtnText: { color: "#000", fontWeight: "700" },
});

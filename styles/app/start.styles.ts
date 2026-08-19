import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: "#FFFFFF" },
	scrollContent: { flexGrow: 1 },
	topBanner: {
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f4bb26",
		borderBottomLeftRadius: 60,
		borderBottomRightRadius: 60,
		overflow: "hidden",
	},
	logoVideo: { width: 200, height: 200 },
	bottomContent: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 24,
		backgroundColor: "#ffffff",
	},
	inputWrapper: {
		marginBottom: 12,
		width: "100%",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
	},
	textInput: { padding: 15 },
	passwordWrapper: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 24,
		width: "100%",
		borderWidth: 1,
		borderColor: "#d1d5db",
		borderRadius: 12,
	},
	passwordInput: { flex: 1, padding: 15 },
	eyeButton: { paddingHorizontal: 10 },
	loginButton: {
		borderRadius: 15,
		paddingVertical: 15,
		width: "100%",
		alignItems: "center",
		marginBottom: 12,
	},
	googleButton: {
		flexDirection: "row",
		backgroundColor: "#ffffff",
		borderRadius: 15,
		paddingVertical: 13,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
		borderWidth: 1,
		borderColor: "#d1d5db",
	},
	googleButtonText: { color: "#000", fontWeight: "700", fontSize: 16 },
	appleButton: {
		flexDirection: "row",
		backgroundColor: "#000000",
		borderRadius: 15,
		paddingVertical: 13,
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		marginTop: 12,
	},
	appleButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
	noAccountText: { color: "#000", fontSize: 18, fontWeight: "700" },
	registerLink: { color: "#f4bb26", fontWeight: "700" },
	centerBoldText: { fontSize: 18, textAlign: "center", fontWeight: "700" },
	blackText: { color: "#000" },
	dropdownContainer: {
		width: "100%",
		alignItems: "center",
		marginBottom: 40,
		zIndex: 9999, // 🔥 FIX: ensures it appears above everything
	},

	dropdownButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 8,
	},

	dropdownList: {
		position: "absolute",
		top: 40,
		backgroundColor: "#fff",
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 10,
		shadowColor: "#000",
		shadowOpacity: 0.2,
		shadowRadius: 6,
		elevation: 10,
		width: 150,
		zIndex: 99999,
	},

	dropdownItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 10,
		paddingHorizontal: 12,
	},

	flag: {
		width: 24,
		height: 16,
		marginRight: 8,
		borderRadius: 3,
	},

	dropdownText: {
		color: "#000",
		fontSize: 14,
	},

	arrow: {
		marginLeft: 5,
		fontSize: 14,
		color: "#333",
	},
});

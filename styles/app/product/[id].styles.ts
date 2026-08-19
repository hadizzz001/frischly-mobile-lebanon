import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
	root: { flex: 1, backgroundColor: "#fff" },
	redText: { color: "red" },
	iconMarginRight: { marginRight: 6 },
	ageModalTitle: { marginBottom: 20, textAlign: "center", fontWeight: "bold" },
	ageModalBody: { marginBottom: 30, textAlign: "center" },
	fullWidth: { width: "100%" },
	ageYesButton: {
		backgroundColor: "#f4bb26",
		paddingVertical: 16,
		borderRadius: 8,
		marginBottom: 15,
		width: "100%",
	},
	ageYesButtonText: { color: "black", textAlign: "center", fontWeight: "bold", fontSize: 18 },
	ageNoButton: { paddingVertical: 16, borderRadius: 8, width: "100%" },
	ageNoButtonText: { color: "#f4bb26", textAlign: "center", fontWeight: "bold", fontSize: 18 },
	container: { flex: 1, backgroundColor: "#fff" },
	swiper: { height: 300 },
	slide: { flex: 1, justifyContent: "center", alignItems: "center" },
	swiperImage: { width: width - 40, height: 250, borderRadius: 8 },
	info: { padding: 16 },
	title: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
	weight: { fontSize: 14, color: "#777", marginBottom: 6 },
	button: {
		backgroundColor: "#000",
		padding: 12,
		borderRadius: 6,
		marginTop: 8,
	},
	buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
	dot: {
		backgroundColor: "rgba(0,0,0,0.2)",
		width: 8,
		height: 8,
		borderRadius: 4,
		margin: 3,
	},
	activeDot: {
		backgroundColor: "#000",
		width: 10,
		height: 10,
		borderRadius: 5,
		margin: 3,
	},
	center: { flex: 1, justifyContent: "center", alignItems: "center" },
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(255,255,255 )",
		zIndex: 100,
		paddingTop: 50,
	},
	imageWrapper: { maxWidth: "90%", maxHeight: "90%" },
	backButton: { marginRight: 6, padding: 4, backgroundColor: "#fff" },

	// Tab Bar
	tabBar: {
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 12,
		backgroundColor: "#fff",
	},
	tabButton: { alignItems: "center", justifyContent: "center" },
	cartBadge: {
		position: "absolute",
		right: -6,
		top: -3,
		backgroundColor: "red",
		borderRadius: 8,
		width: 12,
		height: 12,
	},
	closeBtn: {
		position: "absolute",
		top: 40,
		right: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 200,
	},

	// Overlay contents
	overlayContentProfile: {
		paddingTop: 100,
		paddingHorizontal: 20,
		alignItems: "flex-start",
	},
	overlayContentMenu: {
		flexGrow: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingHorizontal: 20,
	},
	item: { fontSize: 16, marginVertical: 10, color: "#000" },
	row: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
	priceDetails: {
		marginVertical: 8,
	},
	finalPrice: {
		fontSize: 18,
		fontWeight: "bold",
		marginTop: 8,
		marginBottom: 8,
	},
	basePrice: {
		fontSize: 14,
		color: "#333",
	},
	discount: {
		fontSize: 14,
		color: "#e53935",
	},
	tax: {
		fontSize: 14,
		color: "#333",
	},
	bottleRefund: {
		fontSize: 14,
		color: "#333",
	},

	zoomOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.8)",
		justifyContent: "center",
		alignItems: "center",
		zIndex: 100,
	},
	zoomContainer: {
		maxWidth: "100%",
		maxHeight: "100%",
		justifyContent: "center",
		alignItems: "center",
	},
	zoomImage: {
		width: width * 1.2,
		height: width * 1.2,
	},
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 10,
		width: "80%",
	},
	ageTitle: {
		marginBottom: 20,
		textAlign: "center",
		fontWeight: "bold",
	},
	ageBody: {
		marginBottom: 30,
		textAlign: "center",
	},
	ageBtnColumn: {
		width: "100%",
	},
	ageYesBtn: {
		backgroundColor: "#f4bb26",
		paddingVertical: 16,
		borderRadius: 8,
		marginBottom: 15,
		width: "100%",
	},
	ageYesText: {
		color: "black",
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 18,
	},
	ageNoBtn: {
		paddingVertical: 16,
		borderRadius: 8,
		width: "100%",
	},
	ageNoText: {
		color: "#f4bb26",
		textAlign: "center",
		fontWeight: "bold",
		fontSize: 18,
	},
});

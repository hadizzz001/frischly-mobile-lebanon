import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
	Dimensions,
	Modal,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import TextTicker from "react-native-text-ticker";

const { width } = Dimensions.get("window");

const NewsTicker = ({ refreshTrigger }) => {
	const [textItems, setTextItems] = useState([]);
	const [promoData, setPromoData] = useState([]);
	const [modalVisible, setModalVisible] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch(
					"https://frischlyshop-server.onrender.com/api/announcements/public/active",
				);
				const data = await res.json();
				if (data.success && Array.isArray(data.data)) {
					setPromoData(data.data);
					setTextItems(
						data.data.map((item) => `${item.title}: ${item.description}`),
					);
				}
			} catch (error) {
				console.error("Error fetching announcement data:", error);
			}
		};

		fetchData();
	}, [refreshTrigger]);

	const combinedText = textItems.join("     •     "); // Professional separator

	return textItems.length > 0 ? (
		<View style={styles.outerContainer}>
			<TouchableOpacity
				style={styles.container}
				onPress={() => setModalVisible(true)}
				activeOpacity={0.8}
			>
				<View style={styles.iconContainer}>
					<Feather name="gift" size={18} color="#FFC300" />
				</View>
				<View style={styles.tickerContainer}>
					<TextTicker
						style={styles.tickerText}
						duration={30000}
						loop
						bounce={false}
						repeatSpacer={80}
						marqueeDelay={1500}
						scrollSpeed={10}
					>
						{combinedText}
					</TextTicker>
				</View>
			</TouchableOpacity>

			<Modal
				visible={modalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setModalVisible(false)}
			>
				<View style={styles.modalBackground}>
					<View style={styles.modalContainer}>
						<Text style={styles.modalTitle}>Announcements</Text>
						<ScrollView style={styles.scrollView}>
							{promoData.map((promo, index) => (
								<View key={index} style={styles.promoCard}>
									<Text style={styles.companyName}>{promo.title}</Text>
									<Text style={styles.description}>{promo.description}</Text>
								</View>
							))}
						</ScrollView>
						<TouchableOpacity
							style={styles.closeButton}
							onPress={() => setModalVisible(false)}
						>
							<Text style={styles.closeButtonText}>Close</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	) : null;
};

const styles = StyleSheet.create({
	outerContainer: {
		paddingHorizontal: 16,
		marginVertical: 12,
	},
	container: {
		width: "100%",
		height: 48,
		backgroundColor: "#1a1a1a",
		borderRadius: 24,
		flexDirection: "row",
		alignItems: "center",
		overflow: "hidden",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.15,
		shadowRadius: 4,
		elevation: 3,
	},
	iconContainer: {
		width: 44,
		height: 48,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#262626",
		borderTopLeftRadius: 24,
		borderBottomLeftRadius: 24,
	},
	tickerContainer: {
		flex: 1,
		justifyContent: "center",
		paddingRight: 16,
	},
	tickerText: {
		fontSize: 14,
		color: "#FFFFFF",
		fontWeight: "600",
		letterSpacing: 0.3,
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
		width: "90%",
		maxHeight: "80%",
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: "bold",
		textAlign: "center",
		marginBottom: 20,
		color: "#333",
	},
	scrollView: {
		maxHeight: 400,
	},
	promoCard: {
		backgroundColor: "#f9f9f9",
		padding: 15,
		borderRadius: 8,
		marginBottom: 10,
		borderLeftWidth: 4,
		borderLeftColor: "#FFC300",
	},
	companyName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	description: {
		fontSize: 14,
		color: "#666",
		marginBottom: 5,
	},
	code: {
		fontSize: 16,
		fontWeight: "600",
		color: "#FFC300",
	},
	closeButton: {
		backgroundColor: "#FFC300",
		paddingVertical: 12,
		borderRadius: 8,
		marginTop: 20,
		alignItems: "center",
	},
	closeButtonText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "bold",
	},
});

export default NewsTicker;

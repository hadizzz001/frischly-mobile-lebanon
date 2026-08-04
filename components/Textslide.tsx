import { useTranslation } from "@/contexts/TranslationContext";
import { AnnouncementService } from "@/services/api";
import type { Announcement } from "@/types";
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

interface NewsTickerProps {
	refreshTrigger?: number;
}

const NewsTicker = ({ refreshTrigger }: NewsTickerProps) => {
	const { t, td, language } = useTranslation();
	const [textItems, setTextItems] = useState<string[]>([]);
	const [promoData, setPromoData] = useState<Announcement[]>([]);
	const [modalVisible, setModalVisible] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await AnnouncementService.activePublic();
				const items = res.data || [];
				if (Array.isArray(items)) {
					setPromoData(items);
				}
			} catch (error) {
				console.error("Error fetching announcement data:", error);
			}
		};

		fetchData();
	}, [refreshTrigger]);

	// Build the ticker strings through `td()` so the offer/announcement text
	// coming from the API is translated too (static dictionary first, then the
	// free translation API chain). Recomputed on every language change.
	useEffect(() => {
		setTextItems(
			promoData.map(
				(item) => `${td(item.title)}: ${td(item.description)}`,
			),
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [promoData, language, td]);

	const combinedText = textItems.join("     •     "); // Professional separator

	return textItems.length > 0 ? (
		<View style={styles.outerContainer}>
			<TouchableOpacity
				style={styles.container}
				onPress={() => setModalVisible(true)}
				activeOpacity={0.8}
			>
				<View style={styles.iconContainer}>
					<Feather name="gift" size={18} color="#f4bb26" />
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
						<Text style={styles.modalTitle}>{t("announcements")}</Text>
						<ScrollView style={styles.scrollView}>
							{promoData.map((promo, index) => (
								<View key={index} style={styles.promoCard}>
									<Text style={styles.companyName}>{td(promo.title)}</Text>
									<Text style={styles.description}>{td(promo.description)}</Text>
								</View>
							))}
						</ScrollView>
						<TouchableOpacity
							style={styles.closeButton}
							onPress={() => setModalVisible(false)}
						>
							<Text style={styles.closeButtonText}>{t("close")}</Text>
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
		borderLeftColor: "#f4bb26",
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
		color: "#f4bb26",
	},
	closeButton: {
		backgroundColor: "#f4bb26",
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

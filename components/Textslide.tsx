import { useTranslation } from "@/contexts/TranslationContext";
import { AnnouncementService } from "@/services/api";
import { styles } from "@/styles/components/Textslide.styles";
import type { Announcement } from "@/types";
import type { NewsTickerProps } from "@/types/components/Textslide.types";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import TextTicker from "react-native-text-ticker";

export default function NewsTicker({ refreshTrigger }: NewsTickerProps) {
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
}

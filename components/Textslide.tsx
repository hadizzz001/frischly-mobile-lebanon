import Marquee from "@/components/Marquee";
import { useTranslation } from "@/contexts/TranslationContext";
import { AnnouncementService } from "@/services/api";
import { styles } from "@/styles/components/Textslide.styles";
import type { Announcement } from "@/types";
import type { NewsTickerProps } from "@/types/components/Textslide.types";
import { Gift } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function NewsTicker({ refreshTrigger }: NewsTickerProps) {
	const { t, td, language, isRTL } = useTranslation();
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
				(item) => `${td(item.title ?? "")}: ${td(item.description ?? "")}`,
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
					<Gift size={14} strokeWidth={2} color={colors.primaryDark} />
				</View>
				<View style={styles.tickerContainer}>
					{/* Two copies, one linear loop, no pause: see components/Marquee. */}
					<Marquee
						text={combinedText}
						style={styles.tickerText}
						reverse={isRTL}
					/>
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
									<Text style={styles.companyName}>{td(promo.title ?? "")}</Text>
									<Text style={styles.description}>{td(promo.description ?? "")}</Text>
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

// hmr-probe

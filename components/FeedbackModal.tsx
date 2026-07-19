import { FeedbackService } from "@/services/api";
import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import StarRating from "./StarRating";

interface FeedbackModalProps {
	visible: boolean;
	orderId?: string | null;
	onClose?: () => void;
	onSubmitted?: () => void;
}

// Post-checkout feedback modal: asks the shopper to rate BOTH the order and
// the driver (each a 0-5 star rating, unfilled by default) with an optional
// description underneath each. Shown right after an order is created.
export default function FeedbackModal({
	visible,
	orderId,
	onClose,
	onSubmitted,
}: FeedbackModalProps) {
	const { t } = useTranslation();

	const [orderRating, setOrderRating] = useState<number>(0);
	const [orderDescription, setOrderDescription] = useState<string>("");
	const [driverRating, setDriverRating] = useState<number>(0);
	const [driverDescription, setDriverDescription] = useState<string>("");
	const [submitting, setSubmitting] = useState<boolean>(false);

	const resetForm = () => {
		setOrderRating(0);
		setOrderDescription("");
		setDriverRating(0);
		setDriverDescription("");
	};

	const handleClose = () => {
		if (submitting) return;
		resetForm();
		onClose?.();
	};

	const handleSubmit = async () => {
		if (submitting) return;

		if (orderRating <= 0 && driverRating <= 0) {
			Alert.alert(t("errorTitle"), t("pleaseRateAtLeastOne"));
			return;
		}

		if (!orderId) {
			handleClose();
			return;
		}

		try {
			setSubmitting(true);

			const stored = await AsyncStorage.getItem("userData");
			const token = stored ? JSON.parse(stored)?.token : null;
			if (!token) {
				handleClose();
				return;
			}

			await FeedbackService.submit({
				order: orderId,
				orderRating,
				orderDescription,
				driverRating,
				driverDescription,
			});

			Alert.alert(t("success"), t("feedbackThanks"));
			resetForm();
			onSubmitted?.();
			onClose?.();
		} catch (err) {
			Alert.alert(
				t("errorTitle"),
				(err as Error)?.message || t("feedbackSubmitError"),
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={handleClose}
		>
			<View style={styles.modalBackground}>
				<View style={styles.modalContainer}>
					<Text style={styles.title}>{t("feedbackModalTitle")}</Text>
					<Text style={styles.subtitle}>{t("feedbackModalSubtitle")}</Text>

					{/* Order feedback */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("orderFeedbackTitle")}</Text>
						<StarRating rating={orderRating} onChange={setOrderRating} />
						<TextInput
							style={styles.textArea}
							placeholder={t("orderFeedbackPlaceholder")}
							placeholderTextColor="#999"
							multiline
							numberOfLines={3}
							value={orderDescription}
							onChangeText={setOrderDescription}
						/>
					</View>

					{/* Driver feedback */}
					<View style={styles.section}>
						<Text style={styles.sectionTitle}>{t("driverFeedbackTitle")}</Text>
						<StarRating rating={driverRating} onChange={setDriverRating} />
						<TextInput
							style={styles.textArea}
							placeholder={t("driverFeedbackPlaceholder")}
							placeholderTextColor="#999"
							multiline
							numberOfLines={3}
							value={driverDescription}
							onChangeText={setDriverDescription}
						/>
					</View>

					{/* Actions */}
					<TouchableOpacity
						style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
						onPress={handleSubmit}
						disabled={submitting}
					>
						{submitting ? (
							<ActivityIndicator color="#000" />
						) : (
							<Text style={styles.submitBtnText}>{t("submitFeedback")}</Text>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						onPress={handleClose}
						disabled={submitting}
						style={styles.skipBtn}
					>
						<Text style={styles.skipBtnText}>{t("skipForNow")}</Text>
					</TouchableOpacity>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalBackground: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},
	modalContainer: {
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 12,
		width: "88%",
		maxHeight: "85%",
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		textAlign: "center",
		color: "#000",
	},
	subtitle: {
		fontSize: 13,
		textAlign: "center",
		color: "#666",
		marginTop: 4,
		marginBottom: 16,
	},
	section: {
		marginBottom: 16,
		paddingBottom: 4,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: "700",
		color: "#000",
		marginBottom: 8,
	},
	textArea: {
		marginTop: 10,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		padding: 10,
		minHeight: 70,
		textAlignVertical: "top",
		color: "#000",
		fontSize: 14,
	},
	submitBtn: {
		backgroundColor: "#f4bb26",
		paddingVertical: 14,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 6,
	},
	submitBtnDisabled: {
		opacity: 0.7,
	},
	submitBtnText: {
		color: "#000",
		fontWeight: "700",
		fontSize: 16,
	},
	skipBtn: {
		paddingVertical: 14,
		alignItems: "center",
	},
	skipBtnText: {
		color: "#777",
		fontWeight: "600",
		fontSize: 14,
	},
});

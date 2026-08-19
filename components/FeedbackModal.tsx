import { FeedbackService } from "@/services/api";
import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import StarRating from "./StarRating";
import { styles } from "@/styles/components/FeedbackModal.styles";

interface FeedbackModalProps {
	visible: boolean;
	orderId?: string | null;
	/** Shopper dismissed the modal without submitting ("Maybe Later", swipe
	 *  down, or hardware back). Distinct from onSubmitted so the caller can
	 *  snooze future prompts only when the shopper actually skips. */
	onSkip?: () => void;
	/** Feedback was submitted successfully. */
	onSubmitted?: () => void;
}

// Post-delivery feedback modal: asks the shopper to rate BOTH the order and
// the driver (each a 0-5 star rating, unfilled by default) with an optional
// comment underneath each. Shown automatically once an order is delivered.
export default function FeedbackModal({
	visible,
	orderId,
	onSkip,
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

	const handleSkip = () => {
		if (submitting) return;
		resetForm();
		onSkip?.();
	};

	const handleSubmit = async () => {
		if (submitting) return;

		if (orderRating <= 0 && driverRating <= 0) {
			Alert.alert(t("errorTitle"), t("pleaseRateAtLeastOne"));
			return;
		}

		if (!orderId) {
			handleSkip();
			return;
		}

		try {
			setSubmitting(true);

			const stored = await AsyncStorage.getItem("userData");
			const token = stored ? JSON.parse(stored)?.token : null;
			if (!token) {
				handleSkip();
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
		} catch (err) {
			const message = (err as Error)?.message || "";

			// The backend enforces one feedback submission per order. If a
			// duplicate slips through here (e.g. a race with another device,
			// or a delayed retry), the desired end state — no more prompt for
			// this order — is exactly the same as a successful submission, so
			// treat it as "already done" rather than a scary error and close
			// the modal instead of leaving the shopper stuck on it.
			if (/already been submitted/i.test(message)) {
				resetForm();
				onSubmitted?.();
				return;
			}

			Alert.alert(
				t("errorTitle"),
				message || t("feedbackSubmitError"),
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
			onRequestClose={handleSkip}
		>
			<View style={styles.modalBackground}>
				<View style={styles.modalContainer}>
					<View style={styles.headerBadge}>
						<Text style={styles.headerBadgeText}>⭐</Text>
					</View>
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
						onPress={handleSkip}
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

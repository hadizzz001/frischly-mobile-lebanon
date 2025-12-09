"use client";
import { useTranslation } from "@/contexts/TranslationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	Alert,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

// -------------------- PaymentForm Component --------------------
const PaymentForm = () => {
	const { t } = useTranslation();
	const router = useRouter();

	const [holderName, setHolderName] = useState("");
	const [cardNumber, setCardNumber] = useState("");
	const [expiryMonth, setExpiryMonth] = useState("");
	const [expiryYear, setExpiryYear] = useState("");
	const [cvv, setCvv] = useState("");
	const [cardType, setCardType] = useState("");
	const [loading, setLoading] = useState(false);
	const [hasCard, setHasCard] = useState(false);
	const [showForm, setShowForm] = useState(true);

	// For dropdowns
	const months = Array.from({ length: 12 }, (_, i) =>
		String(i + 1).padStart(2, "0")
	);
	const years = Array.from({ length: 15 }, (_, i) =>
		String(new Date().getFullYear() + i)
	);
	const allowedCardTypes = ["visa", "mastercard", "amex", "discover", "other"];

	useEffect(() => {
		const fetchCard = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const guest = await AsyncStorage.getItem("guest");

				if (!userData && !guest) {
					router.replace("/start");
					return;
				}

				if (userData) {
					const { token } = JSON.parse(userData);
					const res = await fetch(
						"https://frischlyshop-server.onrender.com/api/auth/me",
						{
							headers: {
								Authorization: `Bearer ${token}`,
								"Content-Type": "application/json",
							},
						}
					);

					if (res.ok) {
						const data = await res.json();
						const card = data?.data?.user?.creditCard;

						console.log("💳 Fetched card data:", card);

						if (card && card.cardNumber) {
							setHolderName(card.holderName || "");
							setCardNumber(card.cardNumber || "");
							setExpiryMonth(card.expiryMonth || "");
							setExpiryYear(card.expiryYear || "");
							setCardType(card.cardType || "other");
							setHasCard(true);
							setShowForm(false);
						}
					}
				}
			} catch (err) {
				console.error("🔥 Error fetching card:", err);
			}
		};

		fetchCard();
	}, []);

	// -------------------- Validation (matches your schema rules) --------------------
	const validateCard = () => {
		const errors = {};

		// holderName (trim + maxlength)
		const name = holderName.trim();
		if (!name || name.length > 100)
			errors.holderName =
				"Cardholder name is required and cannot exceed 100 characters.";

		// cardNumber (numeric, maxlength 19)
		const number = cardNumber.trim();
		if (!/^\d{13,19}$/.test(number))
			errors.cardNumber = "Card number must be between 13 and 19 digits.";

		// expiryMonth (trim + maxlength 2)
		const month = expiryMonth.trim();
		if (!month || month.length > 2 || !months.includes(month))
			errors.expiryMonth = "Expiry month must be valid and 2 digits (01–12).";

		// expiryYear (trim + maxlength 4)
		const year = expiryYear.trim();
		if (!year || year.length > 4 || !years.includes(year))
			errors.expiryYear = "Expiry year must be valid and 4 digits.";

		// cardType (enum)
		const type = cardType.trim().toLowerCase();
		if (!allowedCardTypes.includes(type))
			errors.cardType =
				"Card type must be Visa, MasterCard, Amex, Discover, or Other.";

		// CVV (basic validation)
		if (!/^\d{3,4}$/.test(cvv)) errors.cvv = "CVV must be 3–4 digits.";

		return { isValid: Object.keys(errors).length === 0, errors };
	};

	const handleSaveCard = async () => {
		const { isValid, errors } = validateCard();
		if (!isValid) {
			Alert.alert(t("validationError"), Object.values(errors).join("\n"));
			return;
		}

		try {
			setLoading(true);
			const stored = await AsyncStorage.getItem("userData");
			if (!stored) return;
			const { token } = JSON.parse(stored);

			const values = {
				holderName: holderName.trim(),
				cardNumber: cardNumber.trim(),
				expiryMonth: expiryMonth.trim(),
				expiryYear: expiryYear.trim(),
				cardType: cardType.trim().toLowerCase(),
				cvv: cvv.trim(),
			};

			console.log("🧾 Final values:", values);

			const res = await fetch(
				"https://frischlyshop-server.onrender.com/api/auth/profile",
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ creditCard: values }),
				}
			);

			if (res.ok) {
				Alert.alert(t("success"), t("creditCardUpdated"));
				setHasCard(true);
				setShowForm(false);
			} else {
				Alert.alert(t("errorTitle"), t("failedUpdateCard"));
			}
		} catch (err) {
			console.error("🔥 Error updating card:", err);
			Alert.alert(t("errorTitle"), t("errorUpdatingCard"));
		} finally {
			setLoading(false);
		}
	};

	// -------------------- Saved Card UI --------------------
	if (hasCard && !showForm) {
		const last4 = cardNumber.slice(-4);
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Saved Card</Text>
				<Text style={{ marginBottom: 10 }}>**** **** **** {last4}</Text>
				<TouchableOpacity
					style={styles.button}
					onPress={() => {
						// Clear all form fields before showing the form
						setHolderName("");
						setCardNumber("");
						setExpiryMonth("");
						setExpiryYear("");
						setCvv("");
						setCardType("");
						setShowForm(true);
					}}
				>
					<Text style={styles.buttonText}>Replace Card</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// -------------------- Card Input Form --------------------
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Payment Information</Text>

			<Text>Card Holder Name</Text>
			<TextInput
				style={styles.input}
				value={holderName}
				onChangeText={(text) => setHolderName(text)}
				maxLength={100}
			/>

			<Text>Card Number</Text>
			<TextInput
				style={styles.input}
				keyboardType="numeric"
				value={cardNumber}
				onChangeText={(text) => setCardNumber(text.replace(/\D/g, ""))}
				maxLength={19}
			/>

			<Text>Expiry Month</Text>
			<View style={styles.pickerContainer}>
				<Picker selectedValue={expiryMonth} onValueChange={setExpiryMonth}>
					<Picker.Item label="Select Month" value="" />
					{months.map((m) => (
						<Picker.Item key={m} label={m} value={m} />
					))}
				</Picker>
			</View>

			<Text>Expiry Year</Text>
			<View style={styles.pickerContainer}>
				<Picker selectedValue={expiryYear} onValueChange={setExpiryYear}>
					<Picker.Item label="Select Year" value="" />
					{years.map((y) => (
						<Picker.Item key={y} label={y} value={y} />
					))}
				</Picker>
			</View>

			<Text>CVV</Text>
			<TextInput
				style={styles.input}
				keyboardType="numeric"
				secureTextEntry
				value={cvv}
				onChangeText={(text) => setCvv(text.replace(/\D/g, ""))}
				maxLength={4}
			/>

			<Text>Card Type</Text>
			<View style={styles.pickerContainer}>
				<Picker selectedValue={cardType} onValueChange={setCardType}>
					<Picker.Item label="Select Card Type" value="" />
					{allowedCardTypes.map((type) => (
						<Picker.Item
							key={type}
							label={type.charAt(0).toUpperCase() + type.slice(1)}
							value={type}
						/>
					))}
				</Picker>
			</View>

			<TouchableOpacity
				style={styles.button}
				onPress={handleSaveCard}
				disabled={loading}
			>
				<Text style={styles.buttonText}>
					{loading ? "Saving..." : "Save Card"}
				</Text>
			</TouchableOpacity>
		</View>
	);
};

// -------------------- Styles --------------------
const styles = StyleSheet.create({
	container: { padding: 20, backgroundColor: "#fff" },
	title: { fontSize: 20, marginBottom: 15, fontWeight: "bold" },
	input: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		padding: 10,
		marginBottom: 12,
	},
	pickerContainer: {
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		marginBottom: 12,
	},
	button: {
		backgroundColor: "#ffc300",
		padding: 15,
		borderRadius: 8,
		alignItems: "center",
		marginTop: 10,
	},
	buttonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});

export default PaymentForm;

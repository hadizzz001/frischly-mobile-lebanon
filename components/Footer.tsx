import { globalStyles } from "@/constants/GlobalStyles";
import { useTranslation } from "@/contexts/TranslationContext";
import { CategoryService } from "@/services/api";
import type { Category } from "@/types";
import { rtlRow } from "@/utils/rtl";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // or next/navigation / @react-navigation/native
import { useEffect, useState } from "react";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Footer() {
	const [categories, setCategories] = useState<Category[]>([]);
	const [showPolicies, setShowPolicies] = useState<boolean>(false);
	const [showCustomerCare, setShowCustomerCare] = useState<boolean>(false);
	const [showCategories, setShowCategories] = useState<boolean>(false);
	const router = useRouter();
	const { t, td, isRTL } = useTranslation();

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await CategoryService.list();
				setCategories(Array.isArray(res?.data) ? res.data : []);
			} catch (e) {
				console.error("Error fetching categories:", e);
			}
		};
		fetchCategories();
	}, []);

	const sections = [
		{
			label: t("policies"),
			isOpen: showPolicies,
			toggle: () => setShowPolicies(!showPolicies),
			items: [
				{ text: t("privacyPolicy"), action: () => router.push("privacy" as never) },
				{ text: t("termsOfService"), action: () => router.push("term" as never) },
			],
		},
		{
			label: t("customerCare"),
			isOpen: showCustomerCare,
			toggle: () => setShowCustomerCare(!showCustomerCare),
			items: [
				{
					text: t("contactUs"),
					action: () => router.push("tel:+961" as never),
				},
			],
		},
		{
			label: t("categories"),
			isOpen: showCategories,
			toggle: () => setShowCategories(!showCategories),
			items: categories.map((cat) => ({
				text: td(cat.name),
				action: () =>
					router.push(`shop1?category=${encodeURIComponent(cat.name)}` as never),
			})),
		},
	];

	return (
		<SafeAreaView edges={["bottom"]} style={globalStyles.lightGrayBg}>
			<View style={styles.footer}>
				{/* Sections */}
				{sections.map((sec, i) => (
					<View key={i} style={styles.section}>
						<TouchableOpacity
							onPress={sec.toggle}
							style={[styles.sectionHeader, rtlRow(isRTL)]}
						>
							<Text style={styles.sectionTitle}>{sec.label}</Text>
							<AntDesign
								name={sec.isOpen ? "up" : "down"}
								size={16}
								color="black"
							/>
						</TouchableOpacity>
						{sec.isOpen && (
							<View style={styles.sectionItems}>
								{sec.items.map((item, j) => (
									<TouchableOpacity key={j} onPress={item.action}>
										<Text style={styles.linkText}>{item.text}</Text>
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>
				))}

				{/* Social Icons */}
				<View style={styles.socialRow}>
					<TouchableOpacity
						onPress={() =>
							Linking.openURL(
								"https://www.instagram.com/freshlylb?igsh=YjJ6Z3FpdGY5aHdt&utm_source=qr"
							)
						}
					>
						<View style={[styles.circle, styles.instagramBg]}>
							<FontAwesome name="instagram" size={24} color="white" />
						</View>
					</TouchableOpacity>
				</View>

				{/* Bottom text */}
				<Text style={styles.bottomText}>
					© Freshly LB {new Date().getFullYear()} {t("allRightReserved")}
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	instagramBg: { backgroundColor: "#E1306C" },
	footer: { backgroundColor: "#f8f8f8", padding: 20, paddingBottom: 60 },
	iconRow: {
		flexDirection: "row",
		justifyContent: "center",
		flexWrap: "wrap",
		marginBottom: 20,
	},
	payIcon: { width: 60, height: 40, margin: 5, resizeMode: "contain" },
	section: {
		marginVertical: 10,
		borderBottomWidth: 1,
		borderColor: "#ccc",
		paddingBottom: 10,
	},
	sectionHeader: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	sectionTitle: { fontSize: 16, fontWeight: "bold" },
	sectionItems: { marginTop: 10 },
	linkText: { fontSize: 14, color: "#444", marginVertical: 4 },
	socialRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
		marginVertical: 20,
	},
	circle: {
		width: 40,
		height: 40,
		borderRadius: 30,
		justifyContent: "center",
		alignItems: "center",
	},
	bottomText: {
		textAlign: "center",
		marginVertical: 20,
		fontSize: 12,
		color: "#666",
	},
});

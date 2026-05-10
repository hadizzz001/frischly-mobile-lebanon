import { useTranslation } from "@/contexts/TranslationContext";
import { AntDesign, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router"; // or next/navigation / @react-navigation/native
import { useEffect, useState } from "react";
import {
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Footer() {
	const [categories, setCategories] = useState([]);
	const [showPolicies, setShowPolicies] = useState(false);
	const [showCustomerCare, setShowCustomerCare] = useState(false);
	const [showCategories, setShowCategories] = useState(false);
	const router = useRouter();
	const { t } = useTranslation();

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch(
					"https://frischly-dash-leb.onrender.com/api/categories"
				);
				const data = await res.json();
				setCategories(data.data || []);
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
				{ text: t("privacyPolicy"), action: () => router.push("privacy") },
				{ text: t("termsOfService"), action: () => router.push("term") },
			],
		},
		{
			label: t("customerCare"),
			isOpen: showCustomerCare,
			toggle: () => setShowCustomerCare(!showCustomerCare),
			items: [
				{
					text: t("contactUs"),
					action: () => router.push("tel:+961"),
				},
			],
		},
		{
			label: t("categories"),
			isOpen: showCategories,
			toggle: () => setShowCategories(!showCategories),
			items: categories.map((cat) => ({
				text: cat.name,
				action: () =>
					router.push(`shop1?category=${encodeURIComponent(cat.name)}`),
			})),
		},
	];

	return (
		<SafeAreaView edges={["bottom"]} style={{ backgroundColor: "#f8f8f8" }}>
			<View style={styles.footer}>
				{/* Sections */}
				{sections.map((sec, i) => (
					<View key={i} style={styles.section}>
						<TouchableOpacity onPress={sec.toggle} style={styles.sectionHeader}>
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
								"https://www.instagram.com/frischly_?igsh=MWs1dWM0dWUwMTJzbA%3D%3D&utm_source=qr"
							)
						}
					>
						<View style={[styles.circle, { backgroundColor: "#E1306C" }]}>
							<FontAwesome name="instagram" size={24} color="white" />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() =>
							Linking.openURL(
								"https://www.facebook.com/profile.php?id=61579362112804"
							)
						}
					>
						<View style={[styles.circle, { backgroundColor: "#1877F2" }]}>
							<FontAwesome name="facebook" size={24} color="white" />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => Linking.openURL("https://wa.me/4915256429941")}
					>
						<View style={[styles.circle, { backgroundColor: "#25D366" }]}>
							<FontAwesome name="whatsapp" size={24} color="white" />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() =>
							Linking.openURL(
								"https://www.tiktok.com/@frischly.gmbh?_t=ZN-90KSmS2b6Mo&_r=1"
							)
						}
					>
						<View style={[styles.circle, { backgroundColor: "black" }]}>
							<FontAwesome5 name="tiktok" size={20} color="white" />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() =>
							Linking.openURL(
								"https://youtube.com/@frischlygmbh?si=gVa5iy0EFWTkHBNn"
							)
						}
					>
						<View style={[styles.circle, { backgroundColor: "red" }]}>
							<FontAwesome5 name="youtube" size={20} color="white" />
						</View>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() =>
							Linking.openURL("https://www.threads.com/@frischlygmbh?invite=0")
						}
					>
						<View
							style={[
								styles.circle,
								{
									backgroundColor: "black",
									justifyContent: "center",
									alignItems: "center",
								},
							]}
						>
							<Image
								source={{
									uri: "https://res.cloudinary.com/dziggyzpb/image/upload/v1763481116/threads-social-media-white-logo-icon-hd-png-735811696672474wx9bzdjwmv-removebg-preview_mznwm0.png",
								}}
								style={{ width: 20, height: 20 }}
								resizeMode="contain"
							/>
						</View>
					</TouchableOpacity>
				</View>

				{/* Bottom text */}
				<Text style={styles.bottomText}>
					© Frischly Shop {new Date().getFullYear()} ALL RIGHTS RESERVED
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
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

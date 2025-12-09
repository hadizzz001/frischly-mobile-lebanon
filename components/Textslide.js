import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import TextTicker from "react-native-text-ticker";

const { width } = Dimensions.get("window");

const NewsTicker = ({ refreshTrigger }) => {
	const [textItems, setTextItems] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const userData = await AsyncStorage.getItem("userData");
				const parsedUser = userData ? JSON.parse(userData) : null;
				const token = parsedUser?.token;

				const headers = token ? { Authorization: `Bearer ${token}` } : {};

				const res = await fetch(
					"https://frischlyshop-server.onrender.com/api/promocodes/public",
					{
						headers,
					}
				);
				const data = await res.json();
				if (data.success && Array.isArray(data.data)) {
					setTextItems(
						data.data.map((item) => `${item.companyName}: ${item.description}`)
					);
				}
			} catch (error) {
				console.error("Error fetching promo data:", error);
			}
		};

		fetchData();
	}, [refreshTrigger]);

	const combinedText = textItems.join("     •     "); // Professional separator

	return textItems.length > 0 ? (
		<View style={styles.outerContainer}>
			<View style={styles.container}>
				<View style={styles.iconContainer}>
					<Feather name="gift" size={18} color="#FFC300" />
				</View>
				<View style={styles.tickerContainer}>
					<TextTicker
						style={styles.tickerText}
						duration={20000}
						loop
						bounce={false}
						repeatSpacer={80}
						marqueeDelay={1500}
						scrollSpeed={40}
					>
						{combinedText}
					</TextTicker>
				</View>
			</View>
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
});

export default NewsTicker;

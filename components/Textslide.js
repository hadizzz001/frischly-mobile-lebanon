import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import TextTicker from "react-native-text-ticker";

const { width } = Dimensions.get("window");

const NewsTicker = () => {
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
	}, []);

	const combinedText = textItems.join("           "); // Customize separator

	return textItems.length > 0 ? (
		<View style={styles.container}>
			<TextTicker
				style={styles.tickerText}
				duration={15000}
				loop
				bounce={false}
				repeatSpacer={50}
				marqueeDelay={1000}
				scrollSpeed={50}
			>
				{combinedText}
			</TextTicker>
		</View>
	) : null;
};

const styles = StyleSheet.create({
	container: {
		width: width - 40,
		height: 60,
		backgroundColor: "#FFC300",
		borderRadius: 15,
		justifyContent: "center",
		overflow: "hidden",
		alignSelf: "center",
		marginVertical: 10,
	},
	tickerText: {
		fontSize: 20,
		color: "#000000",
		paddingHorizontal: 10,
		fontWeight: "bold",
	},
});

export default NewsTicker;

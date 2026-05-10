import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather"; // already imported for left arrow

const { width } = Dimensions.get("window");
const ITEM_WIDTH = 100;
const ITEM_HEIGHT = 140;

export default function CategoryGrid() {
	const [categories, setCategories] = useState([]);
	const router = useRouter();

	useEffect(() => {
		fetch("https://frischly-dash-leb.onrender.com/api/categories")
			.then((res) => res.json())
			.then((data) => {
				if (data.success && Array.isArray(data.data)) {
					setCategories(data.data);
				}
			})
			.catch((err) => console.error(err));
	}, []);

	const getImageUrl = (url) => {
		if (!url) return null;
		const baseUrl = "https://frischly-server.onrender.com";
		const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url}`;
		return fullUrl.includes("?") ? `${fullUrl}&q=10` : `${fullUrl}?q=10`;
	};

	const rows = [[], [], []];
	categories.forEach((item, index) => {
		rows[index % 3].push(item);
	});

	return (
		<View style={{ backgroundColor: "white", padding: 12 }}>
			{/* Header with title, All button, and arrow */}
			<View style={styles.header}>
				<Text style={styles.headerText}>Shop by Category</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push("/shop")}
					>
						<Text style={styles.allText}>All</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push("/shop")}>
						<Feather name="chevron-right" size={24} color="#777" />
					</TouchableOpacity>
				</View>
			</View>

			{/* Category grid */}
			<ScrollView horizontal showsHorizontalScrollIndicator={false}>
				<View style={{ flexDirection: "column" }}>
					{rows.map((rowItems, rowIndex) => (
						<View key={rowIndex} style={styles.row}>
							{rowItems.map((item) => (
								<TouchableOpacity
									key={item._id}
									style={styles.item}
									onPress={() =>
										router.push(`/shop?cat=${encodeURIComponent(item.name)}`)
									}
								>
									<Image
										source={{ uri: getImageUrl(item.image) }}
										style={styles.image}
										resizeMode="contain"
									/>
									<Text style={styles.title} numberOfLines={1}>
										{item.name}
									</Text>
								</TouchableOpacity>
							))}
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: {
		fontSize: 20, // bigger size
		fontWeight: "700",
		color: "#000",
	},
	headerRight: {
		flexDirection: "row",
		alignItems: "center",
	},
	allButton: {
		marginRight: 8,
		paddingHorizontal: 12, // bigger touchable area
		paddingVertical: 6,
		borderRadius: 6,
	},
	allText: {
		fontSize: 18, // bigger text
		fontWeight: "500",
		color: "#777",
	},
	row: {
		flexDirection: "row",
		marginBottom: 10,
	},
	item: {
		width: ITEM_WIDTH,
		height: ITEM_HEIGHT,
		marginRight: 10,
		alignItems: "center",
	},
	image: {
		width: "100%",
		height: 100,
		borderRadius: 8,
		backgroundColor: "#eee",
		marginBottom: 5,
	},
	title: {
		fontSize: 12,
		textAlign: "center",
	},
});

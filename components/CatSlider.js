import { useTranslation } from "@/contexts/TranslationContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width / 4 - 15; // 4 items per row
const ITEM_HEIGHT = 130;

export default function CategoriesGrid({ refreshTrigger }) {
	const { t, td } = useTranslation();

	const router = useRouter();
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchCategories = async () => {
		try {
			setLoading(true);
			const res = await fetch(
				"https://frischly-dash-leb.onrender.com/api/categories?limit=1000"
			);
			const json = await res.json();
			setCategories(json.data || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchCategories();
	}, []);

	useEffect(() => {
		if (refreshTrigger > 0) {
			fetchCategories();
		}
	}, [refreshTrigger]);

	if (loading) {
		return (
			<View
				style={{
					height: ITEM_HEIGHT,
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator size="large" color="#f4bb26" />
				<Text>{t("loadingCategories")}</Text>
			</View>
		);
	}

	const renderCategory = ({ item: category }) => (
		<TouchableOpacity
			key={category._id}
			onPress={() => router.push(`/shop1?category=${encodeURIComponent(category.name)}`)}
			activeOpacity={0.8}
			style={styles.card}
		>
			<View style={styles.imageWrapper}>
				<Image
					source={{ uri: category.image }}
					style={styles.image}
					resizeMode="contain"
				/>
			</View>
			<Text style={styles.name} numberOfLines={2}>
				{td(category.name)}
			</Text>
		</TouchableOpacity>
	);

	return (
		<View style={{ backgroundColor: "#fff", marginTop: 30, paddingBottom: 20 }}>
			<View style={styles.header}>
				<Text style={styles.headerText}>{t("shopByCategory")}</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.allButton}
						onPress={() => router.push("/shop")}
					>
						<Text style={styles.allText}>{t("all")}</Text>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.push("/shop")}>
						<Feather name="chevron-right" size={24} color="#777" />
					</TouchableOpacity>
				</View>
			</View>

			<FlatList
				data={categories}
				renderItem={renderCategory}
				keyExtractor={(item) => item._id}
				numColumns={4}
				contentContainerStyle={styles.gridContainer}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	gridContainer: {
		paddingHorizontal: 8,
	},
	card: {
		width: ITEM_WIDTH,
		margin: 5,
		backgroundColor: "transparent",
		alignItems: "center",
	},
	imageWrapper: {
		width: "100%",
		height: 80,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
	},
	image: { width: "100%", height: "100%", borderRadius: 8 },
	name: {
		fontSize: 12,
		fontWeight: "500",
		color: "#333",
		textAlign: "center",
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	headerText: { fontSize: 20, fontWeight: "700", color: "#000" },
	headerRight: { flexDirection: "row", alignItems: "center" },
	allButton: {
		marginRight: 8,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 6,
	},
	allText: { fontSize: 18, fontWeight: "500", color: "#777" },
});

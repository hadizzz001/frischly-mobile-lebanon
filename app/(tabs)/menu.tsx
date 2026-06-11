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
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "@/contexts/TranslationContext";

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const ITEM_WIDTH = width / NUM_COLUMNS - 20;
const ITEM_HEIGHT = 130;

export default function CategoriesGrid() {
	const { t, td } = useTranslation();
	const router = useRouter();
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
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
		fetchCategories();
	}, []);

	if (loading) {
		return (
			<View style={styles.loadingBox}>
				<ActivityIndicator size="large" color="#f4bb26" />
				<Text>{t("loadingCategories")}</Text>
			</View>
		);
	}

	const renderCategory = ({ item: category }: { item: any }) => (
		<TouchableOpacity
			key={category._id}
			onPress={() =>
				router.push(`/shop1?category=${encodeURIComponent(category.name)}`)
			}
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
		<SafeAreaView edges={["bottom"]} style={styles.safeArea}>
			<FlatList
				key={`grid-${NUM_COLUMNS}`}
				data={categories}
				renderItem={renderCategory}
				keyExtractor={(item) => item._id}
				numColumns={NUM_COLUMNS}
				contentContainerStyle={styles.gridContainer}
				showsVerticalScrollIndicator={false}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		backgroundColor: "#fff",
		paddingBottom: 10, // ✔ extra bottom padding (iPad fix)
	},

	gridContainer: {
		paddingHorizontal: 10,
		paddingBottom: 200, // ✔ ensures bottom items are fully visible
		paddingTop: 20, // ✔ ensures bottom items are fully visible
	},

	loadingBox: {
		height: ITEM_HEIGHT,
		justifyContent: "center",
		alignItems: "center",
	},

	card: {
		width: ITEM_WIDTH,
		margin: 8,
		backgroundColor: "transparent",
		alignItems: "center",
	},

	imageWrapper: {
		width: "100%",
		height: 100,
		backgroundColor: "#f9f9f9",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		marginBottom: 6,
	},

	image: { width: "100%", height: "100%", borderRadius: 8 },

	name: {
		fontSize: 14,
		fontWeight: "500",
		color: "#333",
		textAlign: "center",
	},
});

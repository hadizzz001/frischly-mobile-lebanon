import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTranslation } from "@/contexts/TranslationContext";
import { API_BASE_URL } from "@/constants/api";
import { MENU_NUM_COLUMNS as NUM_COLUMNS } from "@/constants/layout";
import { styles } from "@/styles/app/(tabs)/menu.styles";

export default function CategoriesGrid() {
	const { t, td } = useTranslation();
	const router = useRouter();
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await fetch(
					`${API_BASE_URL}/categories?limit=1000`
				);
				const json = await res.json();
				const data = json?.data;
				const list = Array.isArray(data)
					? data
					: Array.isArray(data?.categories)
						? data.categories
						: [];
				setCategories(list);
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

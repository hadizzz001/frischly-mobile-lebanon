import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import KitchenSlider from "@/components/KitchenSlider";
import MarketsSlider from "@/components/MarketsSlider";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import RepeatOrderButton from "@/components/RepeatOrderButton";
import NewsTicker from "@/components/Textslide";
import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";

export default function HomeScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const onRefresh = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingBottom: 150 }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<NewsTicker refreshTrigger={refreshTrigger} />
				<MarketsSlider refreshTrigger={refreshTrigger} />
				<KitchenSlider refreshTrigger={refreshTrigger} />
				<ProductSlide refreshTrigger={refreshTrigger} />
				<CatSlider refreshTrigger={refreshTrigger} />
				<ProductList
					refreshTrigger={refreshTrigger}
					setRefreshing={setRefreshing}
				/>
				<Footer />
			</ScrollView>
			<RepeatOrderButton />
		</View>
	);
}

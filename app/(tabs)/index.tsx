import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import NewsTicker from "@/components/Textslide";
import { useState } from "react";
import { RefreshControl, ScrollView } from "react-native";

export default function HomeScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const onRefresh = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	return (
		<>
			<ScrollView
				style={{ flex: 1, backgroundColor: "#FFFFFF" }}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<NewsTicker refreshTrigger={refreshTrigger} />
				<ProductSlide refreshTrigger={refreshTrigger} />
				<CatSlider refreshTrigger={refreshTrigger} />
				<ProductList
					refreshTrigger={refreshTrigger}
					setRefreshing={setRefreshing}
				/>
				<Footer />
			</ScrollView>
		</>
	);
}

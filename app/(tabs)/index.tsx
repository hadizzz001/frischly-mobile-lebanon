import CatSlider from "@/components/CatSlider";
import Footer from "@/components/Footer";
import KitchenSlider from "@/components/KitchenSlider";
import MarketsSlider from "@/components/MarketsSlider";
import ProductList from "@/components/ProductList";
import ProductSlide from "@/components/ProductSlide";
import RepeatOrderButton from "@/components/RepeatOrderButton";
import NewsTicker from "@/components/Textslide";
import { globalStyles } from "@/constants/GlobalStyles";
import { refreshAdminCities } from "@/utils/cityVisibility";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, RefreshControl, ScrollView, View } from "react-native";
import { styles } from "@/styles/app/(tabs)/index.styles";

export default function HomeScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	const onRefresh = () => {
		// Force the admin serving-cities to be re-read so a city change in the
		// dashboard is reflected immediately on pull-to-refresh.
		refreshAdminCities();
		setRefreshTrigger((prev) => prev + 1);
	};

	// Auto-refresh when the shopper changes their location from the header nav,
	// so the city-scoped feeds (markets, main store, categories) reload at once.
	useEffect(() => {
		const sub = DeviceEventEmitter.addListener("userCityChanged", () => {
			refreshAdminCities();
			setRefreshTrigger((prev) => prev + 1);
		});
		return () => sub.remove();
	}, []);

	return (
		<View style={styles.container}>
			<ScrollView
				style={globalStyles.flex1}
				contentContainerStyle={styles.scrollContent}
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

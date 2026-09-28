import { Stack, useLocalSearchParams } from "expo-router";

import MarketHome from "@/components/MarketHome";

// A market's home page, opened when a shopper taps a market on the home page
// (or asks for it by voice). The page itself lives in components/MarketHome,
// which the home tab also renders when this is the only store serving them.
export default function MarketScreen() {
	const { id, marketName } = useLocalSearchParams<{
		id: string;
		marketName?: string;
	}>();

	return (
		<>
			<Stack.Screen options={{ headerShown: false }} />
			<MarketHome marketId={String(id)} marketName={marketName} />
		</>
	);
}

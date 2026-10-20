"use client";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useFonts } from "expo-font";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { DeviceEventEmitter, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import BottomNav from "@/components/BottomNav";
import FeedbackModal from "@/components/FeedbackModal";
import LanguageSwitchOverlay from "@/components/LanguageSwitchOverlay";
import Header from "@/components/Header";
import VoiceSearchSheet from "@/components/VoiceSearchSheet";
import { OPEN_VOICE_SEARCH } from "@/constants/events";
import {
	HIDE_BOTTOM_NAV_ROUTES,
	HIDE_HEADER_ROUTES,
	SUPPRESS_FEEDBACK_ROUTES,
} from "@/constants/navigation";
import { BooleanProvider } from "@/contexts/CartBoolContext";
import { CartProvider } from "@/contexts/CartContext";
import { TranslationProvider } from "@/contexts/TranslationContext";
import useDeliveredOrderFeedback from "@/hooks/useDeliveredOrderFeedback";
import useNotifications from "@/hooks/useNotifications";
import { styles } from "@/styles/app/_layout.styles";

export default function RootLayout() {
	const pathname = usePathname(); // current route
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	// Set up push notifications (permissions, token registration, tap handling).
	// Order-status notifications are delivered by the server via Expo push, so
	// they arrive even when the app is fully closed/killed — and, thanks to the
	// foreground handler in useNotifications, still show while the app is open.
	useNotifications();

	// App-wide auto-sync: silently watches the shopper's orders (on an interval
	// + whenever the app returns to the foreground) and pops the feedback modal
	// the moment one becomes "delivered" — from ANY screen.
	const { feedbackOrderId, skipFeedbackModal, submitFeedbackModal } =
		useDeliveredOrderFeedback();

	// Global voice-search sheet, opened from the header mic (or anywhere via
	// the OPEN_VOICE_SEARCH event).
	const [voiceOpen, setVoiceOpen] = useState(false);
	useEffect(() => {
		const sub = DeviceEventEmitter.addListener(OPEN_VOICE_SEARCH, () => setVoiceOpen(true));
		return () => sub.remove();
	}, []);

	if (!loaded) return null;

	// Hide header on login/register page
	const showHeader = !HIDE_HEADER_ROUTES.includes(pathname);

	// Hide the bottom navigation on the pre-login auth screens
	const showBottomNav = !HIDE_BOTTOM_NAV_ROUTES.includes(pathname);

	// Don't interrupt the login/register/checkout flows with the feedback
	// prompt — it'll simply show up as soon as the shopper navigates away
	// from one of these screens (the state persists, nothing is lost).
	const showFeedbackModal =
		!!feedbackOrderId && !SUPPRESS_FEEDBACK_ROUTES.includes(pathname);

	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProvider>
				<TranslationProvider>
					<CartProvider>
						<BooleanProvider>
							<BottomSheetModalProvider>
								<View style={styles.shell} collapsable={false}>
									{showHeader && <Header />}
									<Stack screenOptions={{ headerTitle: "", headerShown: false }}>
										<Stack.Screen name="(tabs)" />
										<Stack.Screen name="start" />
										<Stack.Screen name="register" />
										<Stack.Screen name="forgot-password" />
										<Stack.Screen name="verify-reset-code" />
										<Stack.Screen name="reset-password" />
										<Stack.Screen name="shop" />
										<Stack.Screen name="shop1" />
										{/* No transition: the global header hides on checkout,
										    and during an animated push the outgoing cart visibly
										    jumped up into the header's space before checkout slid
										    in. Swapping in one frame shows no in-between state. */}
										<Stack.Screen name="checkout" options={{ animation: "none" }} />
										<Stack.Screen name="order" />
										<Stack.Screen name="edit-profile" />
										<Stack.Screen name="done" />
										<Stack.Screen name="notifications" />
										<Stack.Screen name="product/[id]" />
										<Stack.Screen name="kitchen/[id]" />
										<Stack.Screen name="market/[id]" />
										<Stack.Screen name="kitchen-category/[id]" />
										<Stack.Screen name="track/[id]" />
										<Stack.Screen name="+not-found" options={{ headerShown: true }} />
									</Stack>
									{showBottomNav && <BottomNav />}
									{/* Voice search lives in a bottom sheet now — no floating
									    button obstructing categories, nav or checkout. */}
									<VoiceSearchSheet visible={voiceOpen} onClose={() => setVoiceOpen(false)} />
									{/* App-wide "rate your order" prompt — auto-shown as soon
									    as an order's status flips to delivered. */}
									<FeedbackModal
										visible={showFeedbackModal}
										orderId={feedbackOrderId}
										onSkip={skipFeedbackModal}
										onSubmitted={submitFeedbackModal}
									/>
									<StatusBar style="dark" />
								</View>
								{/* Full-screen loader while the app re-renders in a new
								    language. A plain view (see LanguageSwitchOverlay), so it
								    sits after the shell: inside it, the bottom nav's Android
								    elevation would draw over the scrim. */}
								<LanguageSwitchOverlay />
							</BottomSheetModalProvider>
						</BooleanProvider>
					</CartProvider>
				</TranslationProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

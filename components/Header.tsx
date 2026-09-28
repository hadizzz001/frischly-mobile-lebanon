import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Bell, ChevronDown, MapPin, Mic, Search, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
	DeviceEventEmitter,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import LocationSheet from "@/components/LocationSheet";
import SearchPlaceholder from "@/components/SearchPlaceholder";
import { OPEN_CITY_PICKER, OPEN_VOICE_SEARCH, USER_CITY_CHANGED } from "@/constants/events";
import { LANGUAGE_OPTIONS } from "@/constants/languages";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { AuthService } from "@/services/api";
import { styles } from "@/styles/components/Header.styles";
import type { User } from "@/types";
import { tapLight } from "@/utils/haptics";
import { formatStreetLine, getCachedAddress, isSignedIn } from "@/utils/userAddress";

// Appbar. Every read of the session is guarded: a guest launch has no
// `userData` at all, so nothing here may assume a user object exists — the
// guest branch renders a "Login / Register" chip in place of the location pill.
export default function Header() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { t, language, switchLanguage, isRTL } = useTranslation();
	const unread = useUnreadNotifications();

	const [searchText, setSearchText] = useState("");
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [isGuest, setIsGuest] = useState(true);
	const [userCity, setUserCity] = useState("");
	// Street/building line for the location sheet — never repeats the city.
	const [userStreet, setUserStreet] = useState("");
	const [locationOpen, setLocationOpen] = useState(false);

	// Session + saved address. Local cache first (instant), then refreshed from
	// the server so a city changed elsewhere shows up here.
	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const signedIn = await isSignedIn();
				if (cancelled) return;
				setIsGuest(!signedIn);
				if (!signedIn) return;

				const cached = await getCachedAddress();
				if (cancelled) return;
				setUserCity(cached?.city ?? "");
				setUserStreet(formatStreetLine(cached));

				try {
					const res = await AuthService.me();
					const fresh = (res?.data as unknown as { user?: User } | null)?.user;
					if (cancelled || !fresh) return;
					setUserCity(fresh.address?.city ?? "");
					setUserStreet(formatStreetLine(fresh.address));
				} catch {
					// keep the cached values
				}
			} catch {
				if (!cancelled) setIsGuest(true);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Follow address changes made anywhere else (profile editor, checkout
	// address card, …) and open requests from empty states / the voice sheet.
	useEffect(() => {
		const changed = DeviceEventEmitter.addListener(
			USER_CITY_CHANGED,
			(payload: string | { city?: string; street?: string }) => {
				const city = typeof payload === "string" ? payload : payload?.city;
				if (city) setUserCity(city);
				if (typeof payload === "object" && payload?.street !== undefined) {
					setUserStreet(formatStreetLine({ city: city ?? "", street: payload.street }));
				}
			},
		);
		const open = DeviceEventEmitter.addListener(OPEN_CITY_PICKER, async () => {
			// Check the session live rather than trusting `isGuest`: it starts
			// as true until the mount effect resolves, so an early tap on the
			// profile's address tile used to bounce a signed-in shopper to
			// /start instead of opening the picker.
			const signedIn = await isSignedIn().catch(() => false);
			if (!signedIn) {
				router.push("/start");
				return;
			}
			setIsGuest(false);
			setLocationOpen(true);
		});
		return () => {
			changed.remove();
			open.remove();
		};
	}, [router]);

	const handleSearchSubmit = () => {
		const q = searchText.trim();
		if (q) router.push(`/shop?search=${encodeURIComponent(q)}`);
	};

	const openVoice = () => {
		tapLight();
		DeviceEventEmitter.emit(OPEN_VOICE_SEARCH);
	};

	const selectedLang =
		LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];

	return (
		<View style={[styles.topNav, { paddingTop: insets.top }]}>
			<View style={[styles.row, isRTL && styles.rowReverse]}>
				<Pressable onPress={() => router.push("/")} accessibilityRole="imagebutton">
					<Image
						source={{
							uri: "https://res.cloudinary.com/dxefurewd/image/upload/v1778403318/freshly_1-removebg-preview_mwrt49.png",
						}}
						style={styles.logo}
						contentFit="contain"
						cachePolicy="memory-disk"
					/>
				</Pressable>

				{isGuest ? (
					<Pressable
						style={({ pressed }) => [styles.guestChip, pressed && { opacity: 0.85 }]}
						onPress={() => router.push("/start")}
						accessibilityRole="button"
						accessibilityHint={t("guestChipHint")}
					>
						<UserRound size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.primaryText} />
						<Text style={styles.guestChipText} numberOfLines={1}>
							{t("loginOrRegister")}
						</Text>
					</Pressable>
				) : (
					<Pressable
						style={({ pressed }) => [
							styles.locationButton,
							isRTL && styles.rowReverse,
							pressed && { opacity: 0.85 },
						]}
						onPress={() => setLocationOpen(true)}
						accessibilityRole="button"
					>
						<MapPin size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
						<View style={styles.locationTextWrap}>
							<Text style={styles.locationLabel} numberOfLines={1}>
								{t("deliverTo")}
							</Text>
							<Text style={styles.locationText} numberOfLines={1}>
								{userCity || t("selectCity")}
							</Text>
						</View>
						<ChevronDown size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
					</Pressable>
				)}

				<Pressable
					style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.surfaceAlt }]}
					onPress={() => router.push("/notifications" as never)}
					accessibilityRole="button"
					accessibilityLabel={t("notifications")}
				>
					<Bell size={icon.sizeLarge} strokeWidth={icon.strokeWidth} color={colors.text} />
					{unread > 0 ? (
						<View style={styles.badge}>
							<Text style={styles.badgeText}>{unread > 99 ? "99+" : unread}</Text>
						</View>
					) : null}
				</Pressable>

				<View style={styles.dropdownContainer}>
					<Pressable
						style={[styles.dropdownButton, isRTL && styles.rowReverse]}
						onPress={() => setDropdownOpen((v) => !v)}
						accessibilityRole="button"
					>
						<Image source={{ uri: selectedLang.flag }} style={styles.flag} cachePolicy="memory-disk" />
						<ChevronDown size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
					</Pressable>
					{dropdownOpen && (
						<View style={styles.dropdownList}>
							{LANGUAGE_OPTIONS.map((lang) => (
								<Pressable
									key={lang.code}
									style={[styles.dropdownItem, isRTL && styles.rowReverse]}
									onPress={() => {
										tapLight();
										switchLanguage(lang.code);
										setDropdownOpen(false);
									}}
								>
									<Image source={{ uri: lang.flag }} style={styles.flag} cachePolicy="memory-disk" />
									<Text style={[styles.dropdownText, lang.code === language && styles.dropdownTextActive]}>
										{lang.name}
									</Text>
								</Pressable>
							))}
						</View>
					)}
				</View>
			</View>

			{/* Search — the placeholder is an animated suggestion ticker, so the
			    input itself carries none. The mic is an inline suffix so voice
			    lives in the primary touch path instead of a floating button. */}
			<View style={[styles.searchWrapper, isRTL && styles.rowReverse]}>
				<Search size={icon.size} strokeWidth={icon.strokeWidth} color={colors.textMuted} />
				<TextInput
					style={styles.searchBox}
					value={searchText}
					onChangeText={setSearchText}
					returnKeyType="search"
					onSubmitEditing={handleSearchSubmit}
					autoCorrect={false}
				/>
				<SearchPlaceholder visible={!searchText} />
				<Pressable
					style={({ pressed }) => [styles.micButton, pressed && { opacity: 0.8 }]}
					onPress={openVoice}
					accessibilityRole="button"
					accessibilityLabel={t("voiceSearchByVoice")}
					hitSlop={6}
				>
					<Mic size={icon.size} strokeWidth={icon.strokeWidth} color={colors.primaryDark} />
				</Pressable>
			</View>

			{/* Always mounted (it's a modal, inert while closed) so an open
			    request can never arrive before the sheet exists. */}
			<LocationSheet
				visible={locationOpen}
				onClose={() => setLocationOpen(false)}
				currentCity={userCity}
				currentStreet={userStreet}
				onSaved={(city) => setUserCity(city)}
			/>
		</View>
	);
}

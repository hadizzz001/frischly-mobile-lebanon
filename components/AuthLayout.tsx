import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react-native";
import { type ReactNode, useState } from "react";
import {
	Keyboard,
	Pressable,
	Text,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LOGO_TRANSPARENT_URL } from "@/constants/brand";
import { LANGUAGE_OPTIONS } from "@/constants/languages";
import { SCREEN_HEIGHT } from "@/constants/layout";
import { colors, icon } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/AuthLayout.styles";

// Shared frame for the auth screens: curved amber header with the transparent
// logo rendered straight on it (no enclosing square), a language pill, an
// optional back button, and a keyboard-aware body that scrolls the focused
// field into view and dismisses the keyboard on tap.
export default function AuthLayout({
	title,
	subtitle,
	children,
	compact = false,
	showBack = false,
	hideLanguage = false,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	/** Shorter banner for secondary screens (reset flow). */
	compact?: boolean;
	showBack?: boolean;
	hideLanguage?: boolean;
}) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { language, switchLanguage, isRTL } = useTranslation();
	const [langOpen, setLangOpen] = useState(false);
	const selectedLang = LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];
	const Back = isRTL ? ChevronRight : ChevronLeft;
	const bannerHeight = compact ? Math.max(SCREEN_HEIGHT * 0.22, 170) : SCREEN_HEIGHT * 0.34;

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<View style={styles.screen}>
				<KeyboardAwareScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					enableOnAndroid
					extraScrollHeight={32}
					showsVerticalScrollIndicator={false}
				>
					<View style={[styles.banner, compact && styles.bannerCompact, { height: bannerHeight }]}>
						<Image
							source={{ uri: LOGO_TRANSPARENT_URL }}
							style={compact ? styles.logoCompact : styles.logo}
							contentFit="contain"
							cachePolicy="memory-disk"
						/>
						<View style={[styles.bannerTop, { top: insets.top + 8 }, isRTL && { flexDirection: "row-reverse" }]}>
							{showBack ? (
								<Pressable style={styles.backOnBanner} onPress={() => router.back()} accessibilityRole="button">
									<Back size={icon.sizeLarge} strokeWidth={icon.strokeWidth} color={colors.text} />
								</Pressable>
							) : (
								<View />
							)}
							{!hideLanguage && (
								<View>
									<Pressable style={styles.langButton} onPress={() => setLangOpen((v) => !v)} accessibilityRole="button">
										<Image source={{ uri: selectedLang.flag }} style={styles.langFlag} cachePolicy="memory-disk" />
										<Text style={styles.langText}>{selectedLang.name}</Text>
										<ChevronDown size={icon.sizeSmall} strokeWidth={icon.strokeWidth} color={colors.text} />
									</Pressable>
									{langOpen && (
										<View style={styles.langList}>
											{LANGUAGE_OPTIONS.map((lang) => (
												<Pressable
													key={lang.code}
													style={styles.langItem}
													onPress={() => {
														switchLanguage(lang.code);
														setLangOpen(false);
													}}
												>
													<Image source={{ uri: lang.flag }} style={styles.langFlag} cachePolicy="memory-disk" />
													<Text style={styles.langText}>{lang.name}</Text>
												</Pressable>
											))}
										</View>
									)}
								</View>
							)}
						</View>
					</View>

					<View style={[styles.body, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
						<Text style={styles.title}>{title}</Text>
						{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
						{children}
					</View>
				</KeyboardAwareScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}

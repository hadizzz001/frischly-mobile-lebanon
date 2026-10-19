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

import AuthLogoAnimation from "@/components/AuthLogoAnimation";
import { LOGO_TRANSPARENT_URL } from "@/constants/brand";
import { LANGUAGE_OPTIONS } from "@/constants/languages";
import { AUTH_TOP_BAR_HEIGHT, PAGE_END_SPACE } from "@/constants/layout";
import { colors, icon, spacing } from "@/constants/theme";
import { useTranslation } from "@/contexts/TranslationContext";
import { styles } from "@/styles/components/AuthLayout.styles";

// Shared frame for the auth screens: curved header with the logo (the animated
// logo on login/register, the transparent cutout on the reset flow), a row with
// the back button and language pill a clear margin below the status bar, and a
// keyboard-aware body that scrolls the focused field into view, dismisses the
// keyboard on tap and leaves room under the last link.
export default function AuthLayout({
	title,
	subtitle,
	children,
	compact = false,
	showBack = false,
	hideLanguage = false,
	animatedLogo = false,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	/** Shorter banner for secondary screens (register, reset flow). */
	compact?: boolean;
	showBack?: boolean;
	hideLanguage?: boolean;
	/** Play the branded animated logo (login / register) instead of the static logo. */
	animatedLogo?: boolean;
}) {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { language, switchLanguage, isRTL } = useTranslation();
	const [langOpen, setLangOpen] = useState(false);
	const selectedLang = LANGUAGE_OPTIONS.find((l) => l.code === language) ?? LANGUAGE_OPTIONS[0];
	const Back = isRTL ? ChevronRight : ChevronLeft;

	// The top row sits a full spacing step below the status bar / notch, and
	// the banner reserves that row's height above the logo so they never overlap.
	const topBarTop = insets.top + spacing.md;
	const bannerPaddingTop = topBarTop + AUTH_TOP_BAR_HEIGHT + spacing.sm;

	const dismiss = () => {
		Keyboard.dismiss();
		setLangOpen(false);
	};

	return (
		<TouchableWithoutFeedback onPress={dismiss} accessible={false}>
			<View style={styles.screen}>
				<KeyboardAwareScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
					enableOnAndroid
					extraScrollHeight={32}
					showsVerticalScrollIndicator={false}
				>
					<View
						style={[
							styles.banner,
							compact && styles.bannerCompact,
							{ paddingTop: bannerPaddingTop },
							animatedLogo && styles.bannerAnimated,
						]}
					>
						{animatedLogo ? (
							<AuthLogoAnimation style={compact ? styles.logoAnimationCompact : styles.logoAnimation} />
						) : (
							<Image
								source={{ uri: LOGO_TRANSPARENT_URL }}
								style={compact ? styles.logoCompact : styles.logo}
								contentFit="contain"
								cachePolicy="memory-disk"
							/>
						)}
					</View>

					<View style={[styles.body, { paddingBottom: insets.bottom + PAGE_END_SPACE }]}>
						<Text style={styles.title}>{title}</Text>
						{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
						{children}
					</View>

					{/* Rendered after the banner and body so the language list opens
					    over them instead of being clipped by the banner's curve. */}
					<View pointerEvents="box-none" style={[styles.topBar, { top: topBarTop }, isRTL && styles.topBarRtl]}>
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
									<View style={[styles.langList, isRTL ? styles.langListRtl : styles.langListLtr]}>
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
				</KeyboardAwareScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}

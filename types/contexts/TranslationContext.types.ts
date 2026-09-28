import type { translations } from "@/utils/locales";

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];

export interface TranslationContextValue {
	t: (key: TranslationKey | string) => string;
	td: (name: string) => string;
	language: Language;
	switchLanguage: (lang: string) => Promise<void>;
	isRTL: boolean;
	/** True from the moment a language change is requested until the app has
	 *  re-rendered in the new language — drives the full-screen loader. */
	switching: boolean;
}

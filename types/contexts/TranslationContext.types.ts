import type { translations } from "@/utils/locales";

export type Language = keyof typeof translations;
export type TranslationKey = keyof (typeof translations)["en"];

export interface TranslationContextValue {
	t: (key: TranslationKey | string) => string;
	td: (name: string) => string;
	language: Language;
	switchLanguage: (lang: string) => Promise<void>;
	isRTL: boolean;
}

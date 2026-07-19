// contexts/TranslationContext.tsx
import { translateDynamic } from "@/utils/dynamicTranslations";
import { translations } from "@/utils/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Language = keyof typeof translations;
type TranslationKey = keyof (typeof translations)["en"];

interface TranslationContextValue {
	t: (key: TranslationKey | string) => string;
	td: (name: string) => string;
	language: Language;
	switchLanguage: (lang: string) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(
	undefined,
);

const DEFAULT_LANGUAGE: Language = "en";

const normalizeLanguage = (lang: string | null | undefined): Language => {
  if (lang === "de") return "ar";
  return lang && (translations as Record<string, unknown>)[lang]
    ? (lang as Language)
    : DEFAULT_LANGUAGE;
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
 

  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);

useEffect(() => {
  const loadLang = async () => {
    const savedLang = await AsyncStorage.getItem("appLanguage");
    const normalizedLang = normalizeLanguage(savedLang);
    setLanguage(normalizedLang);
    if (savedLang && savedLang !== normalizedLang) {
      await AsyncStorage.setItem("appLanguage", normalizedLang);
    }
  };
  loadLang();
}, []);


  // Save language when changed
  const switchLanguage = async (lang: string) => {
    const normalizedLang = normalizeLanguage(lang);
    setLanguage(normalizedLang);
    await AsyncStorage.setItem("appLanguage", normalizedLang);
  };

  const t = (key: TranslationKey | string): string => {
    const dict = translations[language] as Record<string, string>;
    return dict?.[key as string] || translations.en[key as TranslationKey] || (key as string);
  };

  // Translate dynamic (backend) names — categories, subcategories, etc. Falls
  // back to the original text for anything not in the dictionary (brand/product
  // and kitchen names), so those are shown exactly as stored.
  const td = (name: string): string => translateDynamic(name, language);

  return (
    <TranslationContext.Provider value={{ t, td, language, switchLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextValue => {
  const context = useContext(TranslationContext);
  if (!context)
    throw new Error("useTranslation must be used within a TranslationProvider");
  return context;
};

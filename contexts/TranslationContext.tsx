// contexts/TranslationContext.tsx
import { ensureDynamicTranslation, translateDynamic } from "@/utils/dynamicTranslations";
import { translations } from "@/utils/locales";
import { patchTextComponentsForRTL, setGlobalRTL } from "@/utils/rtl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Language = keyof typeof translations;
type TranslationKey = keyof (typeof translations)["en"];

interface TranslationContextValue {
	t: (key: TranslationKey | string) => string;
	td: (name: string) => string;
	language: Language;
	switchLanguage: (lang: string) => Promise<void>;
	isRTL: boolean;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(
	undefined,
);

const DEFAULT_LANGUAGE: Language = "en";

// Patch Text/TextInput once at module load so every instance across the app
// picks up the right textAlign/writingDirection default as soon as Arabic is
// active — see utils/rtl.ts for why this approach (vs. I18nManager.forceRTL)
// was chosen.
patchTextComponentsForRTL();

const normalizeLanguage = (lang: string | null | undefined): Language => {
  if (lang === "de") return "ar";
  return lang && (translations as Record<string, unknown>)[lang]
    ? (lang as Language)
    : DEFAULT_LANGUAGE;
};

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
 

  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  // Bumped whenever a background API translation resolves for a dynamic
  // (backend) name, so every `td()` consumer re-renders and picks it up.
  const [, setTranslationTick] = useState(0);

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

  // Keep the global RTL text-alignment flag in sync with the active language.
  useEffect(() => {
    setGlobalRTL(language === "ar");
  }, [language]);


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

  // Translate dynamic (backend) names — categories, subcategories, kitchen
  // names, product names, market names, offers, etc. Static, common taxonomy
  // words are translated instantly from the local dictionary; anything else
  // falls back to the original text immediately while a free translation API
  // is queried in the background (see utils/dynamicTranslations.ts), and this
  // component re-renders (via translationTick) once that resolves so the
  // translated text then appears — with no per-screen code needed since every
  // page already calls `td()`.
  const td = (name: string): string => {
    if (!name) return name;
    ensureDynamicTranslation(name, language, () =>
      setTranslationTick((v) => v + 1),
    );
    return translateDynamic(name, language);
  };

  return (
    <TranslationContext.Provider
      value={{ t, td, language, switchLanguage, isRTL: language === "ar" }}
    >
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


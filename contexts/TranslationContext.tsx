// contexts/TranslationContext.tsx
import { DirectionContext } from "@/contexts/DirectionContext";
import { ensureDynamicTranslation, translateDynamic } from "@/utils/dynamicTranslations";
import { translations } from "@/utils/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InteractionManager } from "react-native";

import type {
	Language,
	TranslationContextValue,
	TranslationKey,
} from "@/types/contexts/TranslationContext.types";

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
  // Bumped whenever a background API translation resolves for a dynamic
  // (backend) name, so every `td()` consumer re-renders and picks it up.
  const [translationTick, setTranslationTick] = useState(0);
  // A language switch re-renders the entire app (and, for Arabic, kicks off
  // the dynamic translations), which can take a noticeable moment on slower
  // phones. `switching` is true for exactly that window so the UI can show a
  // full-screen loader instead of looking unresponsive.
  const [switching, setSwitching] = useState(false);
  const pendingLanguageRef = useRef<Language | null>(null);

  // Dozens of dynamic names can resolve within the same second; one tick per
  // resolution would re-render the whole tree dozens of times. Coalesce them.
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bumpTick = useCallback(() => {
    if (tickTimerRef.current) return;
    tickTimerRef.current = setTimeout(() => {
      tickTimerRef.current = null;
      setTranslationTick((v) => v + 1);
    }, 250);
  }, []);

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

  // Save language when changed. The loader is shown FIRST (its own commit),
  // and the heavy language re-render happens on the next frame, so the spinner
  // is on screen before the work starts rather than after it finishes.
  const switchLanguage = useCallback(async (lang: string) => {
    const normalizedLang = normalizeLanguage(lang);
    if (normalizedLang === language || pendingLanguageRef.current) return;
    pendingLanguageRef.current = normalizedLang;
    setSwitching(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    setLanguage(normalizedLang);
    try {
      await AsyncStorage.setItem("appLanguage", normalizedLang);
    } catch {
      // The in-memory language still switched; it just won't persist.
    }
  }, [language]);

  // Drop the loader once the tree has re-rendered in the new language.
  useEffect(() => {
    if (pendingLanguageRef.current !== language) return;
    pendingLanguageRef.current = null;
    const task = InteractionManager.runAfterInteractions(() => {
      // One more frame so the last commit is actually painted.
      requestAnimationFrame(() => setSwitching(false));
    });
    return () => task.cancel();
  }, [language]);

  const t = useCallback((key: TranslationKey | string): string => {
    const dict = translations[language] as Record<string, string>;
    return dict?.[key as string] || translations.en[key as TranslationKey] || (key as string);
  }, [language]);

  // Translate dynamic (backend) names — categories, subcategories, kitchen
  // names, product names, market names, offers, etc. Static, common taxonomy
  // words are translated instantly from the local dictionary; anything else
  // falls back to the original text immediately while a free translation API
  // is queried in the background (see utils/dynamicTranslations.ts), and this
  // component re-renders (via translationTick) once that resolves so the
  // translated text then appears — with no per-screen code needed since every
  // page already calls `td()`.
  // `translationTick` is a dependency on purpose: a new `td` identity is what
  // tells memoised consumers that a background translation has landed.
  const td = useCallback((name: string): string => {
    if (!name) return name;
    ensureDynamicTranslation(name, language, bumpTick);
    return translateDynamic(name, language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, bumpTick, translationTick]);

  const value = useMemo(
    () => ({ t, td, language, switchLanguage, isRTL: language === "ar", switching }),
    [t, td, language, switchLanguage, switching],
  );

  // The direction is its own context: every Text/TextInput reads it to align
  // right in Arabic (utils/rtlText/), and it only changes with the
  // language.
  return (
    <TranslationContext.Provider value={value}>
      <DirectionContext.Provider value={language === "ar"}>
        {children}
      </DirectionContext.Provider>
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextValue => {
  const context = useContext(TranslationContext);
  if (!context)
    throw new Error("useTranslation must be used within a TranslationProvider");
  return context;
};


// hmr-probe

// contexts/TranslationContext.js
import { translations } from "@/utils/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const TranslationContext = createContext();

const DEFAULT_LANGUAGE = "en";

const normalizeLanguage = (lang) => {
  if (lang === "de") return "ar";
  return translations[lang] ? lang : DEFAULT_LANGUAGE;
};

export const TranslationProvider = ({ children }) => {
 

  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);

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
  const switchLanguage = async (lang) => {
    const normalizedLang = normalizeLanguage(lang);
    setLanguage(normalizedLang);
    await AsyncStorage.setItem("appLanguage", normalizedLang);
  };

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  return (
    <TranslationContext.Provider value={{ t, language, switchLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);

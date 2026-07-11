"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

// Import all translation files
import en from "@/lib/translations/en.json";
import ar from "@/lib/translations/ar.json";
import so from "@/lib/translations/so.json";
import uk from "@/lib/translations/uk.json";
import fa from "@/lib/translations/fa.json";
import ti from "@/lib/translations/ti.json";
import ku from "@/lib/translations/ku.json";

type TranslationValue = string | Record<string, unknown>;

interface Translations {
  [key: string]: TranslationValue;
}

const translations: Record<string, Translations> = {
  en: en as Translations,
  ar: ar as Translations,
  so: so as Translations,
  uk: uk as Translations,
  fa: fa as Translations,
  ti: ti as Translations,
  ku: ku as Translations,
};

// RTL languages
const RTL_LANGUAGES = ["ar", "fa"];

interface LanguageContextType {
  currentLang: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("go-nurture-lang");
    if (saved && translations[saved]) return saved;
  }
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState(getInitialLanguage);
  const [isRTL, setIsRTL] = useState(() => RTL_LANGUAGES.includes(getInitialLanguage()));

  const setLanguage = useCallback((code: string) => {
    if (translations[code]) {
      setCurrentLang(code);
      setIsRTL(RTL_LANGUAGES.includes(code));
      localStorage.setItem("go-nurture-lang", code);
    }
  }, []);

  // Translation function: t("nav.home") -> gets translations.nav.home
  const t = useCallback(
    (key: string): string => {
      const keys = key.split(".");
      let value: TranslationValue | undefined = translations[currentLang];

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = (value as Record<string, TranslationValue>)[k];
        } else {
          // Fallback to English
          let fallback: TranslationValue | undefined = translations["en"];
          for (const fk of keys) {
            if (fallback && typeof fallback === "object" && fk in fallback) {
              fallback = (fallback as Record<string, TranslationValue>)[fk];
            } else {
              return key;
            }
          }
          return typeof fallback === "string" ? fallback : key;
        }
      }

      return typeof value === "string" ? value : key;
    },
    [currentLang]
  );

  return (
    <LanguageContext.Provider value={{ currentLang, setLanguage, t, isRTL }}>
      <div dir={isRTL ? "rtl" : "ltr"}>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
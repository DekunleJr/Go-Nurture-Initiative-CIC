"use client";

import React, { createContext, useCallback, useContext } from "react";
import en from "@/lib/translations/en.json";

type TranslationValue = string | { [key: string]: TranslationValue };

interface LanguageContextType {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/** English-only copy lookup: t("nav.home") -> en.nav.home. Falls back to the key. */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const t = useCallback((key: string): string => {
    let value: TranslationValue | undefined = en as TranslationValue;
    for (const k of key.split(".")) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }
    return typeof value === "string" ? value : key;
  }, []);

  return <LanguageContext.Provider value={{ t }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

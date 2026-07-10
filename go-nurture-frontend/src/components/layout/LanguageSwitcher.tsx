"use client";

import React, { useState } from "react";
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ isScrolled = false }: { isScrolled?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (l) => l.code === currentLang
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          isScrolled
            ? "text-(--color-primary) hover:bg-(--color-primary)/10"
            : "text-white/80 hover:bg-white/10"
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <Globe size={16} />
        <span className="hidden sm:inline">{currentLanguage?.label || "English"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-(--color-border) bg-white shadow-lg">
            <div className="p-1">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLang(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                    currentLang === lang.code
                      ? "bg-(--color-accent)/10 text-(--color-accent) font-semibold"
                      : "text-foreground hover:bg-background"
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, PARTNER_PORTAL_LINK, SITE_CONFIG } from "@/lib/constants";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

const navTranslationMap: Record<string, string> = {
  "Home": "nav.home",
  "About": "nav.about",
  "Our Programmes": "nav.ourProgrammes",
  "Community Support": "nav.communitySupport",
  "Venues": "nav.venues",
  "Donate": "nav.donate",
  "Contact": "nav.contact",
};

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname?.startsWith("/portal")) return null;
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-(--color-border)">
      <div
        className={`mx-auto flex max-w-7xl lg:max-w-[1600px] items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out ${
          scrolled ? "h-[30px] lg:h-[72px]" : "h-30 lg:h-72"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="inline-flex items-center">
          <div
            className={`relative transition-all duration-300 ease-in-out ${
              scrolled
                ? "w-11 h-11 sm:w-14 sm:h-14 lg:w-35 lg:h-35"
                : "w-44 h-44 sm:w-56 sm:h-56 lg:w-140 lg:h-140"
            }`}
          >
            <Image
              src="/LOGO_v2.png"
              alt={`${SITE_CONFIG.name} logo`}
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-(--color-primary) font-semibold bg-(--color-primary)/10"
                    : "text-foreground hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
                }`}
              >
                {t(navTranslationMap[link.label] || link.label)}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <Link href={PARTNER_PORTAL_LINK.href} className="hidden sm:block">
            <Button
              variant="accent"
              size="sm"
            >
              {t("nav.partnerPortal")}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center justify-center rounded-lg p-2 lg:hidden transition-colors text-foreground hover:bg-(--color-primary)/10"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="border-t border-(--color-border) bg-white lg:hidden">
          <div className="space-y-1 px-4 py-4">
            {NAV_LINKS.map((link) => {
              const isActive = link.href === "/" ? pathname === "/" : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                    isActive
                      ? "text-(--color-primary) font-semibold bg-(--color-primary)/10"
                      : "text-foreground hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
                  }`}
                >
                  {t(navTranslationMap[link.label] || link.label)}
                </Link>
              );
            })}
            <div className="pt-2">
              <Link
                href={PARTNER_PORTAL_LINK.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="accent" size="md" className="w-full">
                  {t("nav.partnerPortal")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

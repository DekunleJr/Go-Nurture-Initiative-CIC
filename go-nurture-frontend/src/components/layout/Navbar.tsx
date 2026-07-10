"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, PARTNER_PORTAL_LINK, SITE_CONFIG } from "@/lib/constants";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-(--color-border)"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20">
            <Image
              src="/LOGO_v1.png"
              alt={`${SITE_CONFIG.name} logo`}
              width={80}
              height={80}
              className="object-contain"
              style={{ width: "auto", height: "100%" }}
              priority
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-(--color-text-dark) hover:bg-(--color-primary)/10 hover:text-(--color-primary)"
                  : "text-white/90 hover:bg-white/10 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher isScrolled={isScrolled} />

          <Link href={PARTNER_PORTAL_LINK.href} className="hidden sm:block">
            <Button
              variant={isScrolled ? "accent" : "outline"}
              size="sm"
              className={!isScrolled ? "border-white/30 text-white hover:bg-white hover:text-(--color-primary)" : ""}
            >
              {PARTNER_PORTAL_LINK.label}
            </Button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex items-center justify-center rounded-lg p-2 lg:hidden transition-colors ${
              isScrolled
                ? "text-(--color-text-dark) hover:bg-(--color-primary)/10"
                : "text-white hover:bg-white/10"
            }`}
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
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-base font-medium text-(--color-text-dark) hover:bg-(--color-primary)/10 hover:text-(--color-primary) transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href={PARTNER_PORTAL_LINK.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button variant="accent" size="md" className="w-full">
                  {PARTNER_PORTAL_LINK.label}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
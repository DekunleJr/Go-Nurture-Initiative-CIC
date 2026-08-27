"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { useLanguage } from "@/lib/LanguageContext";

const FOOTER_LINKS = [
  { labelKey: "footer.linkPrivacy", href: "/privacy" },
  { labelKey: "footer.linkAccessibility", href: "/accessibility" },
  { labelKey: "footer.linkSafeguarding", href: "/safeguarding" },
  { labelKey: "footer.linkComplaints", href: "/complaints" },
  { labelKey: "nav.contact", href: "/contact" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-(--color-border) bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-12 m-0">
          {/* Brand Column */}
          <div className="flex flex-col items-center gap-4 sm:items-start">
            <Link href="/" className="inline-flex items-center mb-0">
              <div className="relative h-18 w-48">
                <Image
                  src="/LOGO_v2.png"
                  alt={`${SITE_CONFIG.name} logo`}
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-sm font-medium text-(--color-primary)">
              {t("hero.headline1")} {t("hero.headline2")}
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
              {t("footer.identityLine")}
            </p>
          </div>

          {/* Contact */}
          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-(--color-primary)">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-(--color-accent) transition-colors"
                >
                  <Mail size={14} className="shrink-0" />
                  <span className="break-all">{SITE_CONFIG.email}</span>
                </a>
              </li>
              <li className="inline-flex items-start justify-center sm:justify-start gap-2 text-sm text-(--color-text-muted)">
                <MapPin size={14} className="mt-0.5 shrink-0" />
                <span>Norwich, Norfolk, United Kingdom</span>
              </li>
            </ul>
          </div>

          {/* Information Links */}
          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-(--color-primary)">
              {t("footer.quickLinks")}
            </h3>
            <ul className="grid grid-cols-2 gap-x-0 gap-y-3 text-center">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-(--color-text-muted) hover:text-(--color-accent) transition-colors"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Legal Line */}
        <div className="mt-10 border-t border-(--color-border) pt-6 text-center">
          <p className="mx-auto mb-4 max-w-3xl text-xs leading-relaxed text-(--color-text-muted)">
            {t("footer.legalLine")}
          </p>
          <p className="text-xs text-(--color-text-muted)">
            &copy; {currentYear} Go Nurture Initiative CIC. {t("footer.copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
}

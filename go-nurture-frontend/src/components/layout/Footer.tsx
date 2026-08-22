"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Mail, MapPin } from "lucide-react";
import { SITE_CONFIG, COMMERCIAL_SITE_URL } from "@/lib/constants";
import { useLanguage } from "@/lib/LanguageContext";


export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-(--color-border) bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 m-0">
          {/* Brand Column */}
          <div className="flex flex-col items-center gap-0">
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
            <p className="max-w-sm text-sm leading-relaxed text-(--color-text-muted)">
              {SITE_CONFIG.tagline}
            </p>
          </div>

          {/* Contact */}
          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--color-primary)">
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
                <span>Norfolk, United Kingdom</span>
              </li>
            </ul>
          </div>

          {/* Commercial Link */}
          <div className="text-center sm:text-left">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--color-primary)">
              {t("footer.commercialTitle")}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-(--color-text-muted)">
              {t("footer.commercialDesc")}
            </p>
            <a
              href={COMMERCIAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-accent) hover:text-(--color-accent-light) transition-colors"
            >
              {t("footer.commercialLink")}
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-(--color-border) pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-(--color-text-muted)">
              &copy; {currentYear} {SITE_CONFIG.name}. {t("footer.copyright")}
            </p>
            <p className="flex items-center gap-1 text-xs text-(--color-text-muted)">
              {t("footer.madeWith")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

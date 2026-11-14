"use client";

import React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/lib/constants";
import { useLanguage } from "@/lib/LanguageContext";

const HOW_ITEMS = ["homeSections.how1", "homeSections.how2", "homeSections.how3", "homeSections.how4"];

export function HomeSections() {
  const { t } = useLanguage();

  return (
    <>
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
              {t("homeSections.belongTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-(--color-text-muted)">
              {t("homeSections.belongBody")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-(--color-bg-sage) py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
            {t("homeSections.howTitle")}
          </h2>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
            {HOW_ITEMS.map((key) => (
              <li key={key} className="flex items-center gap-3 rounded-xl bg-white p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-white">
                  <Check size={14} />
                </span>
                <span className="text-base text-foreground">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
              {t("homeSections.workTitle")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-(--color-text-muted)">
              {t("homeSections.workBody")}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/referrals">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  {t("homeSections.ctaPartner")}
                </Button>
              </Link>
              <Link href="/portal/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  {t("homeSections.ctaSubmit")}
                </Button>
              </Link>
            </div>
            <p className="mt-10 rounded-xl bg-(--color-bg-sage) p-4 text-sm leading-relaxed text-(--color-text-muted)">
              {t("homeSections.safety")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-(--color-bg-sage) py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-bold text-(--color-primary)">
            {t("homeSections.contactTitle")}
          </h2>
          <p className="mt-4 text-(--color-text-muted)">
            {t("homeSections.email")}{" "}
            <a href={`mailto:${SITE_CONFIG.email}`} className="text-(--color-accent) hover:underline break-all">
              {SITE_CONFIG.email}
            </a>
            {"  |  "}
            {t("homeSections.telephone")}{" "}
            <a href={SITE_CONFIG.phoneHref} className="text-(--color-accent) hover:underline">
              {SITE_CONFIG.phone}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

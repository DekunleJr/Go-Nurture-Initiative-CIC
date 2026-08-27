"use client";

import React from "react";
import Link from "next/link";
import { Check, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

const OFFER_ITEMS = [
  "homeOffer.item1",
  "homeOffer.item2",
  "homeOffer.item3",
  "homeOffer.item4",
  "homeOffer.item5",
];

export function HomeOfferFunding() {
  const { t } = useLanguage();

  return (
    <>
      {/* What we provide */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
              {t("homeOffer.eyebrow")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
              {t("homeOffer.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-(--color-text-muted)">
              {t("homeOffer.body")}
            </p>
          </div>

          <ul className="mx-auto mt-12 max-w-3xl space-y-4">
            {OFFER_ITEMS.map((key) => (
              <li
                key={key}
                className="flex items-start gap-3 rounded-xl bg-(--color-bg-sage) p-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-white">
                  <Check size={14} />
                </span>
                <span className="text-base leading-relaxed text-foreground">
                  {t(key)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How our work is funded */}
      <section className="bg-(--color-bg-sage) py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
              {t("homeFunding.eyebrow")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
              {t("homeFunding.heading")}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-(--color-text-muted)">
              {t("homeFunding.body")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/transparency">
                <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                  {t("homeFunding.buttonTransparency")}
                </Button>
              </Link>
              <Link href="/transparency">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-(--color-primary)/30 text-(--color-primary) hover:bg-(--color-primary) hover:text-white sm:w-auto"
                >
                  {t("homeFunding.buttonDonate")}
                  <HeartHandshake size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
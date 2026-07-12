"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Heart, Globe} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function ProgrammesPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-(--color-primary) overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
              {t("programmes.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("programmes.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("programmes.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("programmes.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Cohorts Structure */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("programmes.cohortsLabel")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("programmes.cohortsTitle")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("programmes.cohortsDesc")}
              </p>
            </div>
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_4.jfif"
                alt="Perinatal education session"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Programme Sections */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <BookOpen size={28} />,
                labelKey: "programmes.educationLabel",
                titleKey: "programmes.educationTitle",
                descKey: "programmes.educationDesc",
              },
              {
                icon: <Heart size={28} />,
                labelKey: "programmes.supportLabel",
                titleKey: "programmes.supportTitle",
                descKey: "programmes.supportDesc",
              },
              {
                icon: <Globe size={28} />,
                labelKey: "programmes.multilingualLabel",
                titleKey: "programmes.multilingualTitle",
                descKey: "programmes.multilingualDesc",
              },
            ].map((item) => (
              <div key={item.titleKey} className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                  {item.icon}
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-(--color-accent) mb-2">
                  {t(item.labelKey)}
                </p>
                <h3 className="font-heading text-xl font-bold text-(--color-primary) mb-3">
                  {t(item.titleKey)}
                </h3>
                <p className="text-sm text-(--color-text-muted) leading-relaxed">
                  {t(item.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("programmes.partnersLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("programmes.partnersTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed mb-8">
              {t("programmes.partnersDesc")}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {["NHS Norfolk", "Community Midwives", "Health Visitors", "English Plus", "Bridge Plus", "New Routes", "Churches", "Mosques"].map((partner) => (
                <span key={partner} className="rounded-full bg-(--color-bg-sage) px-4 py-2 text-sm font-medium text-(--color-primary)">
                  {partner}
                </span>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/contact">
                <Button variant="accent" size="lg" className="group">
                  {t("programmes.ctaButton")}
                  <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
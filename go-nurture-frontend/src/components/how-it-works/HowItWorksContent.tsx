"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Users, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export function HowItWorksContent() {
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
              {t("howItWorks.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("howItWorks.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("howItWorks.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("howItWorks.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Step 1: Referral */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_2.jfif"
                alt="Healthcare professional making a referral"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("howItWorks.step1Label")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("howItWorks.step1Title")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("howItWorks.step1Desc")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: <Heart size={22} />, text: "NHS & Midwife Referrals" },
                  { icon: <Shield size={22} />, text: "GDPR-Compliant Portal" },
                  { icon: <Globe size={22} />, text: "Community Partners" },
                  { icon: <Users size={22} />, text: "Informed Consent" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-xl bg-(--color-bg-sage) p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                      {item.icon}
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Cohort Placement */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("howItWorks.step2Label")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("howItWorks.step2Title")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("howItWorks.step2Desc")}
              </p>
            </div>
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_3.jfif"
                alt="Women in a cohort group session"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Free Perinatal Programme */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_4.jfif"
                alt="Perinatal education session"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("howItWorks.step3Label")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("howItWorks.step3Title")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("howItWorks.step3Desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4: Postnatal Support */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("howItWorks.step4Label")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("howItWorks.step4Title")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("howItWorks.step4Desc")}
              </p>
            </div>
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_1.jfif"
                alt="Postnatal community support"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CSR Bridge Model */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("howItWorks.bridgeLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("howItWorks.bridgeTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed">
              {t("howItWorks.bridgeDesc")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: t("howItWorks.bridgeStep1Title"),
                desc: t("howItWorks.bridgeStep1Desc"),
              },
              {
                step: "02",
                title: t("howItWorks.bridgeStep2Title"),
                desc: t("howItWorks.bridgeStep2Desc"),
                highlight: true,
              },
              {
                step: "03",
                title: t("howItWorks.bridgeStep3Title"),
                desc: t("howItWorks.bridgeStep3Desc"),
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`rounded-2xl p-8 text-center transition-all ${
                  item.highlight
                    ? "bg-(--color-accent) text-white shadow-lg shadow-(--color-accent)/30"
                    : "bg-(--color-bg-sage) shadow-sm"
                }`}
              >
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold font-heading ${
                  item.highlight ? "bg-white/20 text-white" : "bg-(--color-primary)/10 text-(--color-primary)"
                }`}>
                  {item.step}
                </div>
                <h3 className={`font-heading text-xl font-bold mb-2 ${
                  item.highlight ? "text-white" : "text-(--color-primary)"
                }`}>
                  {item.title}
                </h3>
                <p className={`text-sm ${item.highlight ? "text-white/80" : "text-(--color-text-muted)"}`}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
            {t("howItWorks.ctaTitle")}
          </h2>
          <p className="text-lg text-(--color-text-muted) mb-8">
            {t("howItWorks.ctaDesc")}
          </p>
          <Link href="/contact">
            <Button variant="accent" size="lg" className="group">
              {t("howItWorks.ctaButton")}
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
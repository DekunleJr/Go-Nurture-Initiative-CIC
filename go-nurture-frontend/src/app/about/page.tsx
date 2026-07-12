"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Users, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function AboutPage() {
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
              {t("about.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("about.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("about.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("about.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_3.jfif"
                alt="Community support"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("about.missionLabel")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("about.missionTitle")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed">
                {t("about.missionDesc")}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: <Heart size={22} />, text: "Asset-Locked CIC" },
                  { icon: <Shield size={22} />, text: "Referral-Only Access" },
                  { icon: <Globe size={22} />, text: "7 Languages" },
                  { icon: <Users size={22} />, text: "Norfolk-Based" },
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

      {/* CSR Bridge Model */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("about.howLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("about.howTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed">
              {t("about.howDesc")}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Nurtured & Nourished",
                desc: "Commercial parent company delivers paid perinatal education packages",
              },
              {
                step: "02",
                title: "CSR Transfer",
                desc: "A portion of profits is allocated to the CIC through Corporate Social Responsibility",
                highlight: true,
              },
              {
                step: "03",
                title: "Free Community Care",
                desc: "Go Nurture delivers free, culturally adapted support to vulnerable women",
              },
            ].map((item) => (
              <div
                key={item.step}
                className={`rounded-2xl p-8 text-center transition-all ${
                  item.highlight
                    ? "bg-(--color-accent) text-white shadow-lg shadow-(--color-accent)/30"
                    : "bg-white shadow-sm"
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

      {/* Pilot + Stats */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
                {t("about.pilotLabel")}
              </p>
              <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
                {t("about.pilotTitle")}
              </h2>
              <p className="text-lg text-(--color-text-muted) leading-relaxed mb-8">
                {t("about.pilotDesc")}
              </p>

              <div className="grid grid-cols-3 gap-6">
                {[
                  { value: t("about.stat1Value"), suffix: t("about.stat1Suffix"), label: t("about.stat1Label") },
                  { value: t("about.stat2Value"), suffix: t("about.stat2Suffix"), label: t("about.stat2Label") },
                  { value: t("about.stat3Value"), suffix: t("about.stat3Suffix"), label: t("about.stat3Label") },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-heading text-3xl font-bold text-(--color-primary)">
                      {stat.value}<span className="text-(--color-accent)">{stat.suffix}</span>
                    </p>
                    <p className="text-sm text-(--color-text-muted) mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-100 rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/hero_2.jfif"
                alt="Mothers and community"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Referral Section */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("about.referralLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("about.referralTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed">
              {t("about.referralDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-4">
            {t("about.ctaTitle")}
          </h2>
          <p className="text-lg text-(--color-text-muted) mb-8">
            {t("about.ctaDesc")}
          </p>
          <Link href="/contact">
            <Button variant="accent" size="lg" className="group">
              {t("about.ctaButton")}
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
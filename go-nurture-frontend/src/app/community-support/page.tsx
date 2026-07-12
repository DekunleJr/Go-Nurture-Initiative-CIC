"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Heart, Users, Building, Church, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function CommunitySupportPage() {
  const { t } = useLanguage();

  const partners = t("communitySupport.partnerList").split(" | ");

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
              {t("communitySupport.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("communitySupport.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("communitySupport.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("communitySupport.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("communitySupport.partnersLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("communitySupport.partnersTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed">
              {t("communitySupport.partnersDesc")}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {partners.map((partner, i) => (
              <div key={partner} className="flex items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-bg-cream) p-4 transition-all hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-(--color-accent)/10 text-(--color-accent)">
                  {i % 2 === 0 ? <Building size={20} /> : <Church size={20} />}
                </div>
                <span className="text-sm font-medium text-foreground">{partner.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Support */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("communitySupport.supportLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-12">
              {t("communitySupport.supportTitle")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Heart size={24} />, key: "communitySupport.supportDesc1" },
              { icon: <Users size={24} />, key: "communitySupport.supportDesc2" },
              { icon: <Shield size={24} />, key: "communitySupport.supportDesc3" },
              { icon: <Heart size={24} />, key: "communitySupport.supportDesc4" },
              { icon: <Building size={24} />, key: "communitySupport.supportDesc5" },
            ].map((item) => (
              <div key={item.key} className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                  {item.icon}
                </div>
                <p className="text-sm leading-relaxed text-foreground pt-2">
                  {t(item.key)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
            {t("communitySupport.involveLabel")}
          </p>
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
            {t("communitySupport.involveTitle")}
          </h2>
          <p className="text-lg text-(--color-text-muted) leading-relaxed mb-8">
            {t("communitySupport.involveDesc")}
          </p>
          <Link href="/contact">
            <Button variant="accent" size="lg" className="group">
              {t("communitySupport.involveButton")}
              <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
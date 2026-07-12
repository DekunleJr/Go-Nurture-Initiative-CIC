"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function ContactPage() {
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
              {t("contact.introLabel")}
            </p>
            <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
              {t("contact.introTitle")}{" "}
              <span className="text-(--color-accent-light)">{t("contact.introTitleHighlight")}</span>
            </h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">
              {t("contact.introDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Details + Form */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Left: Info */}
            <div>
              <div className="space-y-8">
                {/* Email */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                    <Mail size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("contact.email")}</p>
                    <a href="mailto:info@gonurture.org" className="text-(--color-accent) hover:underline">
                      {t("contact.emailValue")}
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t("contact.location")}</p>
                    <p className="text-(--color-text-muted)">{t("contact.locationValue")}</p>
                  </div>
                </div>
              </div>

              {/* Partner CTA */}
              <div className="mt-12 rounded-2xl bg-(--color-bg-sage) p-8">
                <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-2">
                  {t("contact.ctaLabel")}
                </p>
                <h3 className="font-heading text-xl font-bold text-(--color-primary) mb-3">
                  {t("contact.ctaTitle")}
                </h3>
                <p className="text-sm text-(--color-text-muted) mb-6">
                  {t("contact.ctaDesc")}
                </p>
                <Link href="/portal/login">
                  <Button variant="accent" size="md">
                    {t("contact.ctaButton")}
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Form */}
            <div className="rounded-2xl border border-(--color-border) bg-background p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-2">
                {t("contact.partnerLabel")}
              </p>
              <h3 className="font-heading text-2xl font-bold text-(--color-primary) mb-6">
                {t("contact.partnerTitle")}
              </h3>
              <p className="text-sm text-(--color-text-muted) mb-8">
                {t("contact.partnerDesc")}
              </p>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formName")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formName")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formEmail")}
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formEmail")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formSubject")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent"
                    placeholder={t("contact.formSubjectPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t("contact.formMessage")}
                  </label>
                  <textarea
                    rows={5}
                    className="w-full rounded-lg border border-(--color-border) px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:border-transparent resize-none"
                    placeholder={t("contact.formMessagePlaceholder")}
                  />
                </div>
                <Button variant="accent" size="lg" className="w-full">
                  {t("contact.formSubmit")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
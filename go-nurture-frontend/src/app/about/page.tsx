"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Users, Globe, Shield, Sprout } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/LanguageContext";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 lg:pt-80 pb-20 bg-(--color-primary) overflow-hidden">
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
                alt={t("about.missionImageAlt")}
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
                  { icon: <Heart size={22} />, text: t("about.value1") },
                  { icon: <Shield size={22} />, text: t("about.value2") },
                  { icon: <Globe size={22} />, text: t("about.value3") },
                  { icon: <Users size={22} />, text: t("about.value4") },
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

      {/* Our Values */}
      <section className="py-20 bg-(--color-bg-sage)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("about.valuesLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("about.valuesTitle")}
            </h2>
            <p className="text-lg text-(--color-text-muted) leading-relaxed">
              {t("about.valuesIntro")}
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: <Heart size={24} />,
                title: t("about.faithTitle"),
                core: t("about.faithCore"),
                cicContext: t("about.faithCicContext"),
              },
              {
                icon: <Sprout size={24} />,
                title: t("about.growthTitle"),
                core: t("about.growthCore"),
                cicContext: t("about.growthCicContext"),
              },
              {
                icon: <Users size={24} />,
                title: t("about.relationshipsTitle"),
                core: t("about.relationshipsCore"),
                cicContext: t("about.relationshipsCicContext"),
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col rounded-2xl bg-white p-8 shadow-sm">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-(--color-accent)/10 text-(--color-accent)">
                    {item.icon}
                  </div>
                  <h3 className="font-heading text-2xl font-bold text-(--color-primary)">
                    {item.title}
                  </h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
                      {t("about.coreLabel")}
                    </p>
                    <p className="mt-2 text-(--color-text-muted) leading-relaxed">
                      {item.core}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
                      {t("about.cicContextLabel")}
                    </p>
                    <p className="mt-2 text-(--color-text-muted) leading-relaxed">
                      {item.cicContext}
                    </p>
                  </div>
                </div>
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
                alt={t("about.pilotImageAlt")}
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

      {/* Meet the Team */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent) mb-3">
              {t("about.teamLabel")}
            </p>
            <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl mb-6">
              {t("about.teamTitle")}
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: t("about.member1Name"),
                role: t("about.member1Role"),
                bio: t("about.member1Bio"),
                image: t("about.member1Image"),
              },
              {
                name: t("about.member3Name"),
                role: t("about.member3Role"),
                bio: t("about.member3Bio"),
                image: t("about.member3Image"),
              },
              {
                name: t("about.member4Name"),
                role: t("about.member4Role"),
                bio: t("about.member4Bio"),
                image: t("about.member4Image"),
              },
              {
                name: t("about.member2Name"),
                role: t("about.member2Role"),
                bio: t("about.member2Bio"),
                image: t("about.member2Image"),
              },
              {
                name: t("about.member5Name"),
                role: t("about.member5Role"),
                bio: t("about.member5Bio"),
                image: t("about.member5Image"),
              },
              {
                name: t("about.member6Name"),
                role: t("about.member6Role"),
                bio: t("about.member6Bio"),
                image: t("about.member6Image"),
              },
            ].map((member) => (
              <div
                key={member.name}
                className="flex flex-col overflow-hidden rounded-2xl bg-(--color-bg-sage) shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-96 w-full overflow-hidden">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-xl font-bold text-(--color-primary)">
                    {member.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
                    {member.role}
                  </p>
                  <p className="mt-4 text-sm text-(--color-text-muted) leading-relaxed">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 mx-auto max-w-3xl text-center">
            <blockquote className="font-heading text-2xl font-bold text-(--color-primary) sm:text-3xl leading-relaxed">
              &ldquo;{t("about.teamQuote")}&rdquo;
            </blockquote>
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
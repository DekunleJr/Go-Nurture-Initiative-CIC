"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart, BookOpen, Stethoscope, Handshake } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface PlanCardProps {
  icon: React.ReactNode;
  labelKey: string;
  subKey?: string;
  delay: number;
}

function PlanCard({ icon, labelKey, subKey, delay }: PlanCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`rounded-2xl bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-(--color-bg-sage) text-(--color-accent)">
        {icon}
      </div>
      <p className="font-heading text-lg font-semibold leading-snug text-(--color-primary)">
        {labelKey}
      </p>
      {subKey && (
        <p className="mt-2 text-sm text-(--color-text-muted)">{subKey}</p>
      )}
    </div>
  );
}

export function ImpactStats() {
  const { t } = useLanguage();
  const plans = [
    {
      icon: <Heart size={26} />,
      labelKey: t("impact.stat1Label"),
      subKey: undefined,
    },
    {
      icon: <BookOpen size={26} />,
      labelKey: t("impact.stat2Label"),
      subKey: undefined,
    },
    {
      icon: <Stethoscope size={26} />,
      labelKey: t("impact.stat3Label"),
      subKey: t("impact.stat3Sub"),
    },
    {
      icon: <Handshake size={26} />,
      labelKey: t("impact.stat4Label"),
      subKey: undefined,
    },
  ];

  return (
    <section className="bg-(--color-bg-sage) py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
            {t("impact.sectionLabel")}
          </p>
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
            {t("impact.sectionTitle")}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-(--color-text-muted)">
            {t("impact.sectionDesc")}
          </p>
          <p className="mt-6 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-medium text-(--color-text-muted) shadow-sm">
            {t("impact.note")}
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <PlanCard
              key={plan.labelKey}
              icon={plan.icon}
              labelKey={plan.labelKey}
              subKey={plan.subKey}
              delay={i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
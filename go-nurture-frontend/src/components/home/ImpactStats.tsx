"use client";

import React, { useEffect, useRef, useState } from "react";
import { Heart, Users, BookOpen, Globe } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  sublabel: string;
  delay: number;
}

function AnimatedStat({ icon, value, suffix, label, sublabel, delay }: StatItemProps) {
  const [count, setCount] = useState(0);
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

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div
      ref={ref}
      className={`group relative rounded-2xl bg-white p-8 text-center shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-(--color-bg-sage) text-(--color-accent) transition-colors group-hover:bg-(--color-accent) group-hover:text-white">
        {icon}
      </div>
      <p className="font-heading text-4xl font-bold text-(--color-primary) sm:text-5xl">
        {count}
        <span className="text-(--color-accent)">{suffix}</span>
      </p>
      <p className="mt-2 font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-(--color-text-muted)">{sublabel}</p>
    </div>
  );
}

export function ImpactStats() {
  const stats = [
    {
      icon: <Heart size={28} />,
      value: 30,
      suffix: "",
      label: "Women Supported",
      sublabel: "Year 1 pilot target",
    },
    {
      icon: <BookOpen size={28} />,
      value: 3,
      suffix: "",
      label: "Annual Cohorts",
      sublabel: "Free community programmes",
    },
    {
      icon: <Users size={28} />,
      value: 12,
      suffix: "+",
      label: "Referral Partners",
      sublabel: "NHS, faith & community groups",
    },
    {
      icon: <Globe size={28} />,
      value: 7,
      suffix: "",
      label: "Languages Supported",
      sublabel: "Culturally adapted care",
    },
  ];

  return (
    <section className="bg-(--color-bg-sage) py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-(--color-accent)">
            Year 1 Pilot Impact
          </p>
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl">
            Supporting Vulnerable Mothers in Norfolk
          </h2>
          <p className="mt-4 text-lg text-(--color-text-muted)">
            Through referral-led, culturally adapted perinatal education across three annual cohorts,
            we are reaching the women who need support the most.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimatedStat
              key={stat.label}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              sublabel={stat.sublabel}
              delay={i * 150}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
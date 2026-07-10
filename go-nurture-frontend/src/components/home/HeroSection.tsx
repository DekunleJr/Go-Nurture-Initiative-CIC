import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SITE_CONFIG } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/hero_1.jfif"
          alt="Supporting mothers and families in our community"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-(--color-bg-card) to-transparent" />
      </div>

      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-[10%] h-32 w-32 rounded-full bg-(--color-accent)/20 blur-2xl animate-float-slow" />
        <div className="absolute top-1/3 right-[15%] h-24 w-24 rounded-full bg-white/10 blur-xl animate-float" />
        <div className="absolute bottom-1/3 left-[20%] h-40 w-40 rounded-full bg-(--color-accent)/10 blur-3xl animate-pulse-soft" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm animate-fade-in-up">
            <Heart size={14} className="text-(--color-accent-light)" fill="currentColor" />
            Asset-Locked Community Interest Company
          </div>

          {/* Headline */}
          <h1 className="mb-6 font-heading text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl animate-fade-in-up animation-delay-200">
            Empowering Communities,<br />
            <span className="gradient-text">Bridging Birthing Gaps.</span>
          </h1>

          {/* Subheadline — aligned with the brief */}
          <p className="mb-10 max-w-2xl text-lg leading-relaxed text-white/80 animate-fade-in-up animation-delay-400">
            Free, referral-led, culturally adapted perinatal education and community support for
            vulnerable, Minority Ethnic, migrant, refugee, and displaced women across Norfolk.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-start gap-4 sm:flex-row animate-fade-in-up animation-delay-600">
            <Link href="/portal/login">
              <Button
                variant="accent"
                size="lg"
                className="group shadow-xl shadow-(--color-accent)/25 text-base"
              >
                Partner Portal — Make a Referral
                <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/transparency">
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white hover:text-(--color-primary) text-base"
              >
                Support Our Mission
                <Heart size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
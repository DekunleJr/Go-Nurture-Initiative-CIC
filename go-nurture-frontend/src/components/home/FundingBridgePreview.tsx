import React from "react";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingCart, Users, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { COMMERCIAL_SITE_URL } from "@/lib/constants";

export function FundingBridgePreview() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-background to-white py-24 sm:py-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-primary)/5 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-96 w-96 translate-x-1/2 -translate-y-1/2 rounded-full bg-(--color-accent)/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-(--color-primary)/10 px-4 py-1.5 text-sm font-medium text-(--color-primary)">
            <Sparkles size={14} />
            Our Funding Model
          </div>
          <h2 className="font-heading text-3xl font-bold text-(--color-primary) sm:text-4xl lg:text-5xl">
            How Your Support <span className="gradient-text">Creates Impact</span>
          </h2>
          <p className="mt-4 text-lg text-(--color-text-muted)">
            Every purchase from our commercial arm directly funds free community
            perinatal support for women who need it most.
          </p>
        </div>

        <div className="relative mt-20">
          {/* Desktop: Horizontal Flow */}
          <div className="hidden lg:block">
            <div className="relative grid grid-cols-3 items-start gap-8">
              {/* Connecting line - positioned behind icons */}
              <div className="absolute top-12 left-[16.67%] right-[16.67%] h-0.5 bg-linear-to-r from-(--color-primary) via-(--color-accent) to-(--color-primary)" />

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-primary) to-(--color-primary-dark) shadow-lg shadow-(--color-primary)/20">
                  <ShoppingCart className="text-white" size={32} />
                </div>
                <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-primary)/10 px-3 py-0.5 text-xs font-semibold text-(--color-primary)">
                  Step 01
                </span>
                <h3 className="mb-2 font-heading text-xl font-bold text-(--color-primary)">
                  You Purchase
                </h3>
                <p className="px-4 text-sm leading-relaxed text-(--color-text-muted)">
                  Buy maternity education packages from Nurtured and Nourished Health Ltd
                </p>
              </div>

              {/* Step 2 - Highlighted */}
              <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up animation-delay-200">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-(--color-accent) px-4 py-1 text-xs font-bold text-white shadow-lg z-20">
                  THE BRIDGE
                </div>
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-accent) to-(--color-accent-dark) shadow-lg shadow-(--color-accent)/30 ring-4 ring-(--color-accent)/20">
                  <Heart className="text-white" size={36} fill="white" />
                </div>
                <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-accent)/10 px-3 py-0.5 text-xs font-semibold text-(--color-accent)">
                  Step 02
                </span>
                <h3 className="mb-2 font-heading text-xl font-bold text-(--color-accent)">
                  CSR Funding
                </h3>
                <p className="px-4 text-sm leading-relaxed text-(--color-text-muted)">
                  A portion of profits transfers as Corporate Social Responsibility to Go Nurture CIC
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up animation-delay-400">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-primary) to-(--color-primary-dark) shadow-lg shadow-(--color-primary)/20">
                  <Users className="text-white" size={32} />
                </div>
                <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-primary)/10 px-3 py-0.5 text-xs font-semibold text-(--color-primary)">
                  Step 03
                </span>
                <h3 className="mb-2 font-heading text-xl font-bold text-(--color-primary)">
                  Free Support
                </h3>
                <p className="px-4 text-sm leading-relaxed text-(--color-text-muted)">
                  Funds provide free culturally adapted perinatal education to vulnerable women in Norfolk
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: Vertical Flow */}
          <div className="space-y-12 lg:hidden">
            <div className="relative flex flex-col items-center text-center animate-fade-in-up">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-primary) to-(--color-primary-dark) shadow-lg">
                <ShoppingCart className="text-white" size={28} />
              </div>
              <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-primary)/10 px-3 py-0.5 text-xs font-semibold text-(--color-primary)">
                Step 01
              </span>
              <h3 className="mb-2 font-heading text-lg font-bold text-(--color-primary)">
                You Purchase
              </h3>
              <p className="max-w-xs text-sm text-(--color-text-muted)">
                Buy maternity education packages from Nurtured and Nourished Health Ltd
              </p>
              <ArrowDown size={20} className="mt-6 text-(--color-accent) animate-bounce" />
            </div>

            <div className="relative flex flex-col items-center text-center animate-fade-in-up animation-delay-200">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-accent) to-(--color-accent-dark) shadow-lg ring-4 ring-(--color-accent)/20">
                <Heart className="text-white" size={28} fill="white" />
              </div>
              <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-accent)/10 px-3 py-0.5 text-xs font-semibold text-(--color-accent)">
                Step 02 — The Bridge
              </span>
              <h3 className="mb-2 font-heading text-lg font-bold text-(--color-accent)">
                CSR Funding
              </h3>
              <p className="max-w-xs text-sm text-(--color-text-muted)">
                A portion of profits transfers as Corporate Social Responsibility to Go Nurture CIC
              </p>
              <ArrowDown size={20} className="mt-6 text-(--color-accent) animate-bounce" />
            </div>

            <div className="relative flex flex-col items-center text-center animate-fade-in-up animation-delay-400">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-(--color-primary) to-(--color-primary-dark) shadow-lg">
                <Users className="text-white" size={28} />
              </div>
              <span className="mb-2 inline-flex items-center justify-center rounded-full bg-(--color-primary)/10 px-3 py-0.5 text-xs font-semibold text-(--color-primary)">
                Step 03
              </span>
              <h3 className="mb-2 font-heading text-lg font-bold text-(--color-primary)">
                Free Support
              </h3>
              <p className="max-w-xs text-sm text-(--color-text-muted)">
                Funds provide free culturally adapted perinatal education to vulnerable women in Norfolk
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 text-center">
          <div className="mx-auto max-w-2xl rounded-3xl border border-(--color-border) bg-white/80 p-8 shadow-lg backdrop-blur-sm sm:p-12">
            <h3 className="mb-3 font-heading text-2xl font-bold text-(--color-primary)">
              See the Full Picture
            </h3>
            <p className="mb-8 text-sm text-(--color-text-muted)">
              Our transparency dashboard shows exactly how every pound creates community impact.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/transparency">
                <Button
                  variant="accent"
                  size="lg"
                  className="group shadow-lg shadow-(--color-accent)/20"
                >
                  View Transparency Dashboard
                  <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a
                href={COMMERCIAL_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="border-(--color-border)"
                >
                  Visit Nurtured and Nourished
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: `Learn how ${SITE_CONFIG.name} supports women in Norfolk.`,
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-(--color-accent) hover:text-(--color-accent-light) transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>
      <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
        How It Works
      </h1>
      <p className="mt-4 text-lg text-(--color-text-muted)">
        This page is coming soon. Content will explain the referral process, partner network, and how women access free perinatal support.
      </p>
    </div>
  );
}
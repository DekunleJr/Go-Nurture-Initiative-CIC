import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Our Programmes",
  description: `Explore the perinatal education programmes offered by ${SITE_CONFIG.name}.`,
};

export default function ProgrammesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-(--color-accent) hover:text-(--color-accent-light) transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Home
      </Link>
      <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
        Our Programmes
      </h1>
      <p className="mt-4 text-lg text-(--color-text-muted)">
        This page is coming soon. It will feature our culturally adapted perinatal education programmes.
      </p>
    </div>
  );
}
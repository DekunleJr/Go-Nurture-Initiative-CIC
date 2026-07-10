import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Partner Dashboard",
  description: `Partner dashboard for ${SITE_CONFIG.name} referral management.`,
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link
        href="/portal/login"
        className="mb-8 inline-flex items-center gap-1 text-sm text-(--color-accent) hover:text-(--color-accent-light) transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Login
      </Link>
      <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
        Partner Dashboard
      </h1>
      <p className="mt-4 text-lg text-(--color-text-muted)">
        This page is coming soon. Authenticated partners will access their dashboard and referral form here.
      </p>
    </div>
  );
}
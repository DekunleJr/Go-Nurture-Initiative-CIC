import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function PageShell({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <section className="pt-32 lg:pt-80 pb-16 bg-(--color-primary)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-(--color-accent-light) mb-3">
            {label}
          </p>
          <h1 className="font-heading text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
        </div>
      </section>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6 text-(--color-text-muted) leading-relaxed">
          {children}
        </div>
      </section>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-heading text-2xl font-bold text-(--color-primary) pt-4">{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-heading text-lg font-semibold text-(--color-primary)">{children}</h3>;
}

export function MailLink({ email, children }: { email: string; children?: React.ReactNode }) {
  return (
    <a href={`mailto:${email}`} className="text-(--color-accent) hover:underline break-all">
      {children ?? email}
    </a>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
}) {
  const className = cn(
    "inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-semibold transition-colors",
    variant === "primary"
      ? "bg-(--color-primary) text-white hover:bg-(--color-primary-light)"
      : "border-2 border-(--color-accent) text-(--color-accent) hover:bg-(--color-accent) hover:text-white"
  );
  if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-(--color-border) bg-(--color-bg-sage) p-4 text-sm text-(--color-text-dark)">
      {children}
    </p>
  );
}

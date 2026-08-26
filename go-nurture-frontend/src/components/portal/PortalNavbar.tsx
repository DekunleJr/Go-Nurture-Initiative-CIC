"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG } from "@/lib/constants";

interface PortalNavbarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PortalNavbar({ title, subtitle, actions }: PortalNavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-(--color-border) shadow-sm">
      <div className="grid h-20 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:h-30 sm:grid-cols-[auto_1fr_auto] sm:gap-4 sm:px-6 lg:px-8">
        {/* Left: Logo / Brand */}
        <Link href="/" className="inline-flex items-center">
          <div className="relative h-12 w-28 sm:h-20 sm:w-48">
            <Image
              src="/LOGO_v1.png"
              alt={`${SITE_CONFIG.name} logo`}
              fill
              priority
              sizes="(max-width: 640px) 7rem, 12rem"
              className="object-contain"
            />
          </div>
        </Link>

        {/* Middle: Page identity */}
        {title && (
          <div className="min-w-0 text-center">
            <h1 className="truncate font-heading text-base font-bold text-(--color-primary) sm:text-xl">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden truncate text-xs text-(--color-text-muted) sm:block">{subtitle}</p>
            )}
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center justify-end gap-2">{actions}</div>
      </div>
    </header>
  );
}
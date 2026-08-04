"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Shield } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface PartnerData {
  contact_name: string;
  organisation_name: string;
  is_admin?: boolean;
}

export function PortalNavbar() {
  const partner = useLocalStorage<PartnerData>("partner");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith("/admin");

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("partner");
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-(--color-border) shadow-sm">
      <div className="mx-auto flex h-30 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo / Brand */}
        <Link href="/" className="inline-flex items-center">
          <div className="relative w-44 h-44 sm:w-56 sm:h-56">
            <Image
              src="/LOGO_v1.png"
              alt={`${SITE_CONFIG.name} logo`}
              fill
              priority
              sizes="(max-width: 640px) 17.5rem, 14rem"
              className="object-contain"
            />
          </div>
        </Link>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-4">
          {partner && (
            <span className="text-sm text-(--color-text-muted)">
              {partner.contact_name} · {partner.organisation_name}
            </span>
          )}
          {partner && partner.is_admin && (
            <Link
              href={isAdminPage ? "/portal/dashboard" : "/admin/dashboard"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-(--color-accent) px-4 py-2 text-sm font-medium text-white hover:bg-(--color-accent)/90 transition-colors"
            >
              <Shield size={16} />
              {isAdminPage ? "Portal" : "Admin"}
            </Link>
          )}
          {partner && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden rounded-lg p-2 text-foreground hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-(--color-border) bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            {partner && (
              <p className="text-sm text-(--color-text-muted) pb-2">
                {partner.contact_name} · {partner.organisation_name}
              </p>
            )}
            {partner && partner.is_admin && (
              <Link
                href={isAdminPage ? "/portal/dashboard" : "/admin/dashboard"}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-(--color-accent) hover:bg-gray-50 transition-colors"
              >
                <Shield size={18} />
                {isAdminPage ? "Portal" : "Admin Dashboard"}
              </Link>
            )}
            {partner && (
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Sprout } from "lucide-react";
import toast from "react-hot-toast";
import { SITE_CONFIG } from "@/lib/constants";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.post<{
        access_token: string;
        role?: string;
        partner?: {
          contact_name: string;
          email: string;
          organisation_name: string;
          is_admin?: boolean;
        };
        facilitator?: { name: string; email: string };
      }>("/api/auth/login", { email, password });

      // Normalise the user object and route by role
      const role: string = data.role || "partner";
      const user =
        role === "facilitator"
          ? { role, name: data.facilitator?.name, email: data.facilitator?.email }
          : {
              role,
              name: data.partner?.contact_name,
              email: data.partner?.email,
              organisation_name: data.partner?.organisation_name,
              is_admin: data.partner?.is_admin,
            };

      authClient.setToken(data.access_token);
      authClient.setUser(user);
      if (data.partner) {
        authClient.setPartner(data.partner);
      }

      toast.success("Welcome back! Redirecting...");
      if (role === "admin") router.push("/admin/dashboard");
      else if (role === "facilitator") router.push("/portal/facilitator");
      else router.push("/portal/dashboard");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) p-10 text-white lg:flex lg:min-h-105 lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-float" />
            <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-(--color-accent-light)/30 blur-2xl animate-float-slow" />
          </div>
          <div className="relative">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
              <Sprout size={28} className="text-white" />
            </div>
            <h2 className="mt-6 font-heading text-3xl font-bold leading-tight">
              Go Nurture <span className="font-accent italic">Initiative</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/80">
              Welcome to the partner portal — manage referrals, track programme placements and support mothers through their journey.
            </p>
          </div>
          <p className="relative text-xs text-white/60">
            {SITE_CONFIG.name} Partner Portal
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-(--color-border)">
          <h1 className="font-heading text-3xl font-bold text-(--color-primary)">
            Partner Portal Login
          </h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Sign in to access your referral dashboard and manage submissions.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full rounded-lg border border-(--color-border) px-4 py-2 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Sign In
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            <Link
              href="/portal/forgot-password"
              className="text-(--color-accent) hover:text-(--color-accent-dark) font-medium"
            >
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

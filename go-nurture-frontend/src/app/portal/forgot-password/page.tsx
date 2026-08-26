"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, KeyRound, Sprout } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/auth/forgot-password", { email });

      setSent(true);
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
            Go Nurture Initiative Partner Portal
          </p>
        </div>

        {/* Reset card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-(--color-border)">
          {sent ? (
            <div className="text-center">
              <MailCheck size={48} className="mx-auto text-(--color-accent) mb-4" />
              <h1 className="font-heading text-2xl font-bold text-(--color-primary)">
                Check Your Email
              </h1>
              <p className="mt-3 text-sm text-(--color-text-muted) leading-relaxed">
                If an account exists with <span className="font-medium text-foreground">{email}</span>,
                we&apos;ve sent a password reset link. The link expires in 48 hours.
              </p>
              <Link
                href="/portal/login"
                className="mt-6 inline-block text-sm font-medium text-(--color-accent) hover:text-(--color-accent-dark)"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <KeyRound size={28} className="text-(--color-accent)" />
                <h1 className="font-heading text-2xl font-bold text-(--color-primary)">
                  Forgot Password?
                </h1>
              </div>
              <p className="mt-3 text-sm text-(--color-text-muted)">
                Enter the email address associated with your partner account and
                we&apos;ll send you a link to choose a new password.
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
                    placeholder="you@organisation.org"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  Send Reset Link
                </button>
              </form>

              <p className="mt-4 text-center text-sm">
                <Link
                  href="/portal/login"
                  className="text-(--color-accent) hover:text-(--color-accent-dark) font-medium"
                >
                  ← Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, MailCheck, KeyRound } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-(--color-border) bg-white p-8 shadow-sm">
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
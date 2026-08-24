"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

function SetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const isReset = searchParams.get("reset") === "true";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const data = await api.post<{ access_token: string; partner: unknown }>("/api/auth/set-password", { token, password });

      if (typeof window !== "undefined") {
        authClient.setToken(data.access_token);
        authClient.setPartner(data.partner);
      }
      toast.success(isReset ? "Password updated! Redirecting to dashboard..." : "Password set! Redirecting to dashboard...");
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/portal/dashboard";
      }, 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-600 mb-4" />
            <h1 className="font-heading text-2xl font-bold text-red-900">
              {isReset ? "Invalid Reset Link" : "Invalid Invitation"}
            </h1>
            <p className="mt-2 text-red-700">
              This {isReset ? "password reset" : "password setup"} link is invalid or has expired.
            </p>
            <p className="mt-4 text-sm text-red-600">
              Please{" "}
              <a href="/portal/forgot-password" className="underline font-medium">
                request a new reset link
              </a>{" "}
              or contact the Go Nurture team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
            <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
            <h1 className="font-heading text-2xl font-bold text-green-900">
              {isReset ? "Password Updated!" : "Password Set!"}
            </h1>
            <p className="mt-2 text-green-700">Redirecting you to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-(--color-border) bg-white p-8 shadow-sm">
          <h1 className="font-heading text-3xl font-bold text-(--color-primary)">
            {isReset ? "Choose a New Password" : "Set Your Password"}
          </h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            {isReset
              ? "Enter a new password for your partner portal account."
              : "Create a password to access the partner portal."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-(--color-border) px-4 py-2 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

            <div>
              <label className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-(--color-border) px-4 py-2 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isReset ? "Update Password & Continue" : "Set Password & Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-(--color-primary)" />
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}

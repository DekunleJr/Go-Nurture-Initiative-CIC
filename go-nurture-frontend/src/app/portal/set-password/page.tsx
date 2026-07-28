"use client";

import { useState} from "react";
// import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SetPasswordPage() {
  const [token] = useState(() => {
    if (typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      return urlToken || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => {
    if (typeof window !== "undefined") {
      const urlToken = new URLSearchParams(window.location.search).get("token");
      return urlToken ? "" : "Invalid or missing invitation token.";
    }
    return "Invalid or missing invitation token.";
  });
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to set password");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("partner", JSON.stringify(data.partner));
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/portal/dashboard";
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
            <h1 className="font-heading text-2xl font-bold text-red-900">Invalid Invitation</h1>
            <p className="mt-2 text-red-700">This password setup link is invalid or has expired.</p>
            <p className="mt-4 text-sm text-red-600">Please contact the Go Nurture team for a new invitation.</p>
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
            <h1 className="font-heading text-2xl font-bold text-green-900">Password Set!</h1>
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
            Set Your Password
          </h1>
          <p className="mt-2 text-sm text-(--color-text-muted)">
            Create a password to access the partner portal.
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Set Password & Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
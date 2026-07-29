"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { SITE_CONFIG } from "@/lib/constants";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("partner", JSON.stringify(data.partner));
      toast.success("Welcome back! Redirecting to dashboard...");
      router.push("/portal/dashboard");
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
              <input
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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

          <p className="mt-4 text-center text-xs text-(--color-text-muted)">
            {SITE_CONFIG.name} Partner Portal
          </p>
        </div>
      </div>
    </div>
  );
}
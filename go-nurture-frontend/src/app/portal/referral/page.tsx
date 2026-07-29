"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PortalNavbar } from "@/components/portal/PortalNavbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mother_name: "",
    mother_phone: "",
    estimated_due_date: "",
    language_requirement: "",
    additional_notes: "",
    requires_interpreter: false,
    consent_obtained: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("You must be logged in to submit a referral.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/referrals/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to submit referral");
      }

      toast.success("Referral submitted successfully!");
      router.push("/portal/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
          New Referral
        </h1>
        <p className="mt-2 text-(--color-text-muted)">
          Submit a referral for a mother who would benefit from our perinatal support services.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">
                Mother&apos;s Full Name *
              </label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Mother&apos;s Phone Number *
              </label>
              <input
                type="tel"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={formData.mother_phone}
                onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Estimated Due Date *
              </label>
              <input
                type="date"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={formData.estimated_due_date}
                onChange={(e) => setFormData({ ...formData, estimated_due_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Language Requirement
              </label>
              <input
                type="text"
                placeholder="e.g. Arabic, Somali"
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={formData.language_requirement}
                onChange={(e) => setFormData({ ...formData, language_requirement: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Additional Notes
            </label>
            <textarea
              rows={4}
              className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
              value={formData.additional_notes}
              onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-(--color-border)"
                checked={formData.requires_interpreter}
                onChange={(e) => setFormData({ ...formData, requires_interpreter: e.target.checked })}
              />
              <span className="text-sm text-foreground">Requires interpreter</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                required
                className="h-4 w-4 rounded border-(--color-border)"
                checked={formData.consent_obtained}
                onChange={(e) => setFormData({ ...formData, consent_obtained: e.target.checked })}
              />
              <span className="text-sm text-foreground">
                I confirm that explicit consent has been obtained from the mother&nbsp;*
              </span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Submit Referral
            </button>
            <a href="/portal/dashboard">
              <button
                type="button"
                className="rounded-lg border border-(--color-border) px-6 py-3 text-center hover:bg-gray-50"
              >
                Cancel
              </button>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
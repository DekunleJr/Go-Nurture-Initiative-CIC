"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface PartnerData {
  contact_name: string;
  organisation_name: string;
  is_admin?: boolean;
}

export default function ReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const partner = useLocalStorage<PartnerData>("partner");
  const [formData, setFormData] = useState({
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    estimated_due_date: "",
    referral_type: "birth_confidence",
    language_requirement: "",
    additional_notes: "",
    requires_interpreter: false,
    consent_obtained: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!authClient.isLoggedIn()) {
      toast.error("You must be logged in to submit a referral.");
      setLoading(false);
      return;
    }

    try {
      await api.post("/api/referrals/", formData);

      toast.success("Referral submitted successfully!");
      router.push("/portal/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.post("/api/auth/logout").finally(() => {
      authClient.clear();
      router.push("/portal/login");
    });
  };

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar
        title="New Referral"
        subtitle="Go Nurture Initiative · Referral Management"
        actions={
          <>
            {partner?.is_admin && (
              <Link
                href="/admin/dashboard" aria-label="Admin"
                className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-white transition hover:bg-(--color-accent-dark) sm:px-4"
              >
                <Shield size={16} /><span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            <button
              onClick={handleLogout} aria-label="Sign out"
              className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage)"
            >
              <LogOut size={16} /><span className="hidden sm:inline">Sign out</span>
            </button>
          </>
        }
      />

      {/* ===== Hero Header ===== */}
      <header className="relative overflow-hidden bg-(--color-primary) bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-2xl animate-float" />
          <div className="absolute bottom-0 left-1/4 h-56 w-56 rounded-full bg-(--color-accent-light)/30 blur-2xl animate-float-slow" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <div className="animate-fade-in-up">
            <p className="text-sm font-medium uppercase tracking-widest text-white/70">Refer a mother</p>
            <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">
              Submit a <span className="font-accent italic">referral</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Submit a referral for a mother who would benefit from our perinatal support services.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-(--color-border) space-y-6 sm:p-8">
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
                Mother&apos;s Email *
              </label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                placeholder="Used to send her programme details"
                value={formData.mother_email}
                onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Program Type *
              </label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2"
                value={formData.referral_type}
                onChange={(e) => setFormData({ ...formData, referral_type: e.target.value })}
              >
                <option value="birth_confidence">Favour Oloye Birth Confidence Program</option>
                <option value="breastfeeding_clinic">Breastfeeding Support Clinic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground">
                Estimated Due Date {formData.referral_type !== "breastfeeding_clinic" && "*"}
              </label>
              <input
                type="date"
                required={formData.referral_type !== "breastfeeding_clinic"}
                disabled={formData.referral_type === "breastfeeding_clinic"}
                className={`mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2 ${
                  formData.referral_type === "breastfeeding_clinic"
                    ? "bg-gray-100 cursor-not-allowed text-gray-400"
                    : ""
                }`}
                value={formData.estimated_due_date}
                onChange={(e) => setFormData({ ...formData, estimated_due_date: e.target.value })}
              />
              {formData.referral_type === "breastfeeding_clinic" && (
                <p className="mt-1 text-xs text-gray-400">Not applicable for the clinic type.</p>
              )}
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
              className="rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-6 py-3 text-white hover:opacity-95 disabled:opacity-50 shadow-sm flex items-center gap-2 transition"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              Submit Referral
            </button>
            <a href="/portal/dashboard">
              <button
                type="button"
                className="rounded-lg border border-(--color-border) px-6 py-3 text-center hover:bg-(--color-bg-sage)"
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
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, FileText, Pencil, X, LogOut, ClipboardList, ShieldCheck, Clock, Users, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import type { Referral } from "@/types";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import { useLocalStorage } from "@/lib/useLocalStorage";
import Pagination from "../../admin/dashboard/components/Pagination";

interface PartnerData {
  contact_name: string;
  organisation_name: string;
  is_admin?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [page, setPage] = useState(1);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [editFormData, setEditFormData] = useState({
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    estimated_due_date: "",
    referral_type: "birth_confidence",
    language_requirement: "",
    additional_notes: "",
    requires_interpreter: false,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const partner = useLocalStorage<PartnerData>("partner");

  const canEdit = (referral: Referral) => referral.status !== "completed" && referral.status !== "declined";

  // Derived referral stats
  const statusCounts = referrals.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  const total = referrals.length;
  const pending = statusCounts["pending"] || 0;
  const approved = statusCounts["approved"] || 0;
  const rejected = statusCounts["rejected"] || 0;
  const completed = statusCounts["completed"] || 0;

  const firstName = partner?.contact_name?.trim().split(/\s+/)[0] || "Partner";

  const handleLogout = () => {
    authClient.clear();
    router.push("/portal/login");
  };

  const handleEditClick = (referral: Referral) => {
    setEditingReferral(referral);
    setEditFormData({
      mother_name: referral.mother_name,
      mother_phone: referral.mother_phone,
      mother_email: referral.mother_email || "",
      estimated_due_date: referral.estimated_due_date ? referral.estimated_due_date.slice(0, 10) : "",
      referral_type: (referral as unknown as { referral_type?: string }).referral_type || "birth_confidence",
      language_requirement: referral.language_requirement || "",
      additional_notes: "",
      requires_interpreter: referral.requires_interpreter,
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferral) return;
    setSavingEdit(true);
    try {
      await api.patch(`/api/referrals/${editingReferral.id}`, editFormData);
      toast.success("Referral updated successfully");
      setEditingReferral(null);
      // Refresh the list
      setReferrals(await api.get<Referral[]>("/api/referrals/"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = authClient.getToken();
    if (!token) {
      router.push("/portal/login");
      return;
    }

    let isMounted = true;

    api.get<Referral[]>("/api/referrals/")
      .then((data) => {
        if (isMounted) {
          setReferrals(data);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error fetching referrals:", error);
        if (isMounted) {
          toast.error("Failed to load referrals. Please try again later.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(referrals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleReferrals = referrals.slice(start, start + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar
        title="Partner Dashboard"
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
          <div className="flex flex-col gap-5 animate-fade-in-up sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-white/70">Welcome back</p>
              <h2 className="mt-2 font-heading text-4xl font-bold sm:text-5xl">
                <span className="font-accent italic">{firstName}</span>
              </h2>
              <p className="mt-3 max-w-xl text-sm text-white/80 sm:text-base">
                Submit and manage referrals for mothers who would benefit from our perinatal support services.
              </p>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-3 animate-fade-in-up animation-delay-200">
              {[
                { label: "Referrals", value: total, icon: <ClipboardList size={16} /> },
                { label: "Approved", value: approved, icon: <ShieldCheck size={16} /> },
                { label: "Pending", value: pending, icon: <Clock size={16} /> },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-xl font-bold leading-none">{s.value}</p>
                    <p className="mt-1 text-xs text-white/70">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">

        {/* Stat strip */}
        {loading ? (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                    <div className="h-7 w-12 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Total referrals</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{total}</p>
                </div>
                <div className="rounded-xl bg-(--color-bg-sage) p-3 text-(--color-accent)">
                  <ClipboardList size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Pending</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{pending}</p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-3 text-yellow-700">
                  <Clock size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Approved</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{approved}</p>
                </div>
                <div className="rounded-xl bg-green-50 p-3 text-green-700">
                  <ShieldCheck size={22} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-(--color-text-muted)">Declined</p>
                  <p className="mt-1 text-3xl font-bold text-(--color-primary)">{rejected}</p>
                </div>
                <div className="rounded-xl bg-red-50 p-3 text-red-700">
                  <Users size={22} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-heading text-2xl font-bold text-(--color-primary)">Referrals</h3>
            {partner && (
              <p className="mt-1 text-sm text-(--color-text-muted)">
                {partner.contact_name} · {partner.organisation_name}
              </p>
            )}
          </div>
          <a href="/portal/referral">
            <button className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:opacity-95">
              <Plus size={18} />
              New Referral
            </button>
          </a>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border)">
            <div className="border-b border-(--color-border) bg-(--color-bg-sage) px-6 py-4">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="divide-y divide-gray-200">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 py-4">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200" />
                  <div className="h-3.5 w-24 animate-pulse rounded bg-gray-200" />
                  <div className="ml-auto h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-2xl border border-(--color-border) bg-white p-12 text-center shadow-sm">
            <FileText size={48} className="mx-auto text-(--color-text-muted) mb-4" />
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
              No referrals yet
            </h3>
            <p className="text-(--color-text-muted)">
              Get started by submitting your first referral.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border)">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-(--color-border)">
                <thead className="bg-(--color-bg-sage)">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Mother
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Interpreter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Cohort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border)">
                  {visibleReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-(--color-bg-sage)">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {referral.mother_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {referral.mother_phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {referral.mother_email || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {new Date(referral.estimated_due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {referral.language_requirement || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {referral.requires_interpreter ? (
                          <span className="inline-flex rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">Yes</span>
                        ) : (
                          <span className="text-(--color-text-muted)">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {[referral.cohort_name, referral.clinic_cohort_name].filter(Boolean).join(" · ") || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {referral.venue_name || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          referral.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : referral.status === "approved"
                              ? "bg-green-50 text-green-700"
                              : referral.status === "pending"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                        }`}>
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {canEdit(referral) ? (
                          <button
                            onClick={() => handleEditClick(referral)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-(--color-accent) hover:text-(--color-primary)"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={currentPage} pageSize={PAGE_SIZE} total={referrals.length} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Edit Referral Modal */}
      {editingReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl my-8 overflow-hidden animate-scale-in">
            <div className="relative overflow-hidden bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) px-6 py-5 text-white">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <div className="absolute -top-10 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              </div>
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading text-xl font-bold">Edit Referral</h3>
                  <p className="mt-0.5 text-xs text-white/70">{editingReferral.mother_name}</p>
                </div>
                <button onClick={() => setEditingReferral(null)} className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white">
                  <X size={22} />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother&apos;s Full Name *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={editFormData.mother_name}
                    onChange={(e) => setEditFormData({ ...editFormData, mother_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={editFormData.mother_phone}
                    onChange={(e) => setEditFormData({ ...editFormData, mother_phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    required
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={editFormData.mother_email}
                    onChange={(e) => setEditFormData({ ...editFormData, mother_email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Type *</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={editFormData.referral_type}
                    onChange={(e) => setEditFormData({ ...editFormData, referral_type: e.target.value })}
                  >
                    <option value="birth_confidence">Favour Oloye Birth Confidence Program</option>
                    <option value="breastfeeding_clinic">Breastfeeding Support Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date {editFormData.referral_type !== "breastfeeding_clinic" && "*"}
                  </label>
                  <input
                    type="date"
                    required={editFormData.referral_type !== "breastfeeding_clinic"}
                    disabled={editFormData.referral_type === "breastfeeding_clinic"}
                    className={`mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 ${
                      editFormData.referral_type === "breastfeeding_clinic" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                    value={editFormData.estimated_due_date}
                    onChange={(e) => setEditFormData({ ...editFormData, estimated_due_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language Requirement</label>
                  <input
                    type="text"
                    placeholder="e.g. Arabic, Somali"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                    value={editFormData.language_requirement}
                    onChange={(e) => setEditFormData({ ...editFormData, language_requirement: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                  value={editFormData.additional_notes}
                  onChange={(e) => setEditFormData({ ...editFormData, additional_notes: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={editFormData.requires_interpreter}
                  onChange={(e) => setEditFormData({ ...editFormData, requires_interpreter: e.target.checked })}
                />
                <span className="text-sm text-gray-700">Requires interpreter</span>
              </label>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="w-full rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-4 py-2 text-white hover:opacity-95 disabled:opacity-50 shadow-sm sm:flex-1"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Pencil, X } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-4xl font-bold text-(--color-primary)">
            Partner Dashboard
          </h1>
          {partner && (
            <p className="mt-2 text-(--color-text-muted)">
              Welcome, {partner.contact_name} from {partner.organisation_name}
            </p>
          )}
        </div>

        <div className="mb-6">
          <a href="/portal/referral">
            <button className="inline-flex items-center gap-2 rounded-lg bg-(--color-primary) px-6 py-3 text-white hover:bg-(--color-primary)/90 transition-colors">
              <Plus size={18} />
              New Referral
            </button>
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <FileText size={32} className="animate-spin text-(--color-primary)" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="rounded-xl border border-(--color-border) bg-white p-12 text-center">
            <FileText size={48} className="mx-auto text-(--color-text-muted) mb-4" />
            <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
              No referrals yet
            </h3>
            <p className="text-(--color-text-muted)">
              Get started by submitting your first referral.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--color-border) bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-(--color-border)">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mother
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Interpreter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cohort
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Venue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border)">
                  {visibleReferrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-gray-900">Edit Referral</h3>
              <button onClick={() => setEditingReferral(null)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
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
                  className="w-full rounded-lg bg-(--color-primary) px-4 py-2 text-white hover:bg-(--color-primary)/90 disabled:opacity-50 sm:flex-1"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingReferral(null)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 sm:flex-1"
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

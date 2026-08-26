"use client";

import { useState } from "react";
import { Search, Filter, X, FileText, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <FileText size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface Referral {
  id: string;
  mother_name: string;
  mother_phone: string;
  mother_email: string | null;
  estimated_due_date: string;
  referral_type?: string;
  language_requirement: string | null;
  requires_interpreter: boolean;
  status: string;
  partner_id: string;
  partner_name: string | null;
  cohort_id: string | null;
  clinic_cohort_name?: string | null;
  cohort_name: string | null;
  venue_name: string | null;
  created_at: string;
}

interface Cohort {
  id: string;
  name: string;
  cohort_type?: string;
}

interface ReferralsTabProps {
  referrals: Referral[];
  cohorts: Cohort[];
  onUpdateStatus: (referralId: string, status: string, cohortId?: string) => Promise<void>;
  onEditReferral: (referralId: string, data: Record<string, unknown>) => Promise<void>;
  onRefresh: () => void;
}

export default function ReferralsTab({ referrals, cohorts, onUpdateStatus, onEditReferral, onRefresh }: ReferralsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [page, setPage] = useState(1);

  const handleEditClick = (referral: Referral) => {
    setEditingReferral(referral);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReferral) return;
    setSavingEdit(true);
    try {
      const form = new FormData(e.target as HTMLFormElement);
      await onEditReferral(editingReferral.id, {
        mother_name: form.get("mother_name"),
        mother_phone: form.get("mother_phone"),
        mother_email: form.get("mother_email"),
        estimated_due_date: form.get("estimated_due_date"),
        referral_type: form.get("referral_type"),
        language_requirement: form.get("language_requirement") || null,
        additional_notes: form.get("additional_notes") || null,
        requires_interpreter: form.get("requires_interpreter") === "on",
      });
      toast.success("Referral updated successfully");
      setEditingReferral(null);
      onRefresh();
    } catch {
      // Error toast shown by handler in page.tsx
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.mother_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.mother_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleReferrals = filteredReferrals.slice(start, start + PAGE_SIZE);

  const handleUpdateStatus = async (referralId: string, status: string, cohortId?: string) => {
    await onUpdateStatus(referralId, status, cohortId);
    setSelectedReferral(null);
    onRefresh();
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--color-border)">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-heading text-xl font-bold text-gray-900">
            All Referrals ({referrals.length})
          </h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search referrals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-(--color-border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
            </div>
            <div className="relative w-full sm:w-auto">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-(--color-border) rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--color-border)">
          <thead className="bg-(--color-bg-sage)">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Mother</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Created By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Cohort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {visibleReferrals.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6">
                  <EmptyState message="No referrals found" />
                </td>
              </tr>
            ) : (
              visibleReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-(--color-bg-sage)">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {referral.mother_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {referral.mother_phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {referral.mother_email || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {referral.partner_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {[referral.cohort_name, referral.clinic_cohort_name].filter(Boolean).join(" · ") || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {referral.venue_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {new Date(referral.estimated_due_date).toLocaleDateString()}
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEditClick(referral)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                        title="Edit referral details"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReferral(referral);
                          setSelectedCohortId(referral.partner_id || "");
                        }}
                        className="text-xs capitalize text-(--color-accent) hover:text-(--color-primary)"
                      >
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filteredReferrals.length} onPageChange={setPage} />

      {/* Assign/Review Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Referral Details</h3>
              <button onClick={() => setSelectedReferral(null)} className="text-gray-400 hover:text-(--color-text-muted)">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-(--color-text-muted)">Mother Name</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_name}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Phone</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_phone}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Email</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Estimated Due Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedReferral.estimated_due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Current Status</p>
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  selectedReferral.status === "rejected"
                    ? "bg-red-50 text-red-700"
                    : selectedReferral.status === "approved"
                      ? "bg-green-50 text-green-700"
                      : selectedReferral.status === "pending"
                        ? "bg-yellow-50 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                }`}>
                  {selectedReferral.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Assign to Cohort</p>
                <select
                  id="cohort-select"
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                >
                  <option value="">Select a cohort...</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                      {cohort.cohort_type === "breastfeeding_clinic" ? " (Clinic)" : " (Birth Confidence)"}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-(--color-text-muted)">
                  Assigning to a cohort of the same program type replaces her previous assignment of that type.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedReferral.id, "approved", selectedCohortId || undefined)}
                className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:flex-1"
              >
                Approve & Assign
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReferral.id, "rejected")}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 sm:flex-1"
              >
                Reject
              </button>
              <button
                onClick={() => setSelectedReferral(null)}
                className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Referral Modal */}
      {editingReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-scale-in my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-gray-900">Edit Referral</h3>
              <button onClick={() => setEditingReferral(null)} className="text-gray-400 hover:text-(--color-text-muted)">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother&apos;s Full Name *</label>
                  <input name="mother_name" type="text" required defaultValue={editingReferral.mother_name} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input name="mother_phone" type="tel" required defaultValue={editingReferral.mother_phone} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input name="mother_email" type="email" required defaultValue={editingReferral.mother_email || ""} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Program Type *</label>
                  <select name="referral_type" defaultValue={(editingReferral as unknown as { referral_type?: string }).referral_type || "birth_confidence"} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2">
                    <option value="birth_confidence">Favour Oloye Birth Confidence Program</option>
                    <option value="breastfeeding_clinic">Breastfeeding Support Clinic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input name="estimated_due_date" type="date" defaultValue={editingReferral.estimated_due_date?.slice(0, 10)} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Language Requirement</label>
                  <input name="language_requirement" type="text" defaultValue={editingReferral.language_requirement || ""} className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                <textarea name="additional_notes" rows={3} defaultValue="" className="mt-1 w-full rounded-lg border border-(--color-border) px-3 py-2" />
              </div>

              <label className="flex items-center gap-3">
                <input name="requires_interpreter" type="checkbox" defaultChecked={editingReferral.requires_interpreter} className="h-4 w-4 rounded border-gray-300" />
                <span className="text-sm text-gray-700">Requires interpreter</span>
              </label>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <button type="submit" disabled={savingEdit} className="w-full rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-4 py-2 text-white hover:opacity-95 disabled:opacity-50 sm:flex-1">
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditingReferral(null)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:flex-1">
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

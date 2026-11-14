"use client";

import { useState } from "react";
import { Search, Filter, X, FileText, Pencil, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";
import ReferralModal, { type ReferralDetails } from "./ReferralModal";

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <FileText size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

interface Referral extends Partial<Omit<ReferralDetails, "id" | "status" | "created_at" | "mother_name">> {
  id: string;
  mother_name: string;
  reference_number?: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  estimated_due_date: string | null;
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
  const [modalReferral, setModalReferral] = useState<{ referral: Referral; mode: "view" | "edit" } | null>(null);
  const [page, setPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSaveEdit = async (id: string, data: Record<string, unknown>) => {
    // onEditReferral shows its own error toast and rethrows, which keeps the modal open.
    await onEditReferral(id, data);
    toast.success("Referral updated successfully");
    onRefresh();
  };

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.mother_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (referral.mother_phone ?? "").includes(searchQuery) ||
      (referral.reference_number ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredReferrals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleReferrals = filteredReferrals.slice(start, start + PAGE_SIZE);

  const handleUpdateStatus = async (referralId: string, status: string, cohortId?: string) => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(referralId, status, cohortId);
      setSelectedReferral(null);
      onRefresh();
    } finally {
      setUpdatingStatus(false);
    }
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
                    {referral.mother_phone || "-"}
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
                    {referral.estimated_due_date ? new Date(referral.estimated_due_date).toLocaleDateString() : "-"}
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
                        onClick={() => setModalReferral({ referral, mode: "view" })}
                        className="inline-flex items-center text-(--color-primary) hover:text-(--color-accent)"
                        title="View full referral"
                        aria-label={`View referral for ${referral.mother_name}`}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setModalReferral({ referral, mode: "edit" })}
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

      {modalReferral && (
        <ReferralModal
          key={`${modalReferral.referral.id}-${modalReferral.mode}`}
          referral={modalReferral.referral as unknown as ReferralDetails}
          initialMode={modalReferral.mode}
          onClose={() => setModalReferral(null)}
          onSave={handleSaveEdit}
        />
      )}

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
                <p className="font-medium text-gray-900">{selectedReferral.mother_phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Email</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-(--color-text-muted)">Estimated Due Date</p>
                <p className="font-medium text-gray-900">
                  {selectedReferral.estimated_due_date ? new Date(selectedReferral.estimated_due_date).toLocaleDateString() : "-"}
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
                      {cohort.cohort_type === "breastfeeding_clinic" ? " (Clinic)" : " (Antenatal)"}
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
                disabled={updatingStatus}
                className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingStatus ? <><Loader2 size={16} className="animate-spin" /> Approving...</> : "Approve & Assign"}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReferral.id, "rejected")}
                disabled={updatingStatus}
                className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 sm:flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {updatingStatus ? <><Loader2 size={16} className="animate-spin" /> Rejecting...</> : "Reject"}
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
    </div>
  );
}

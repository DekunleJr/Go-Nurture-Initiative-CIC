"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";

interface Referral {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string;
  status: string;
  partner_id: string;
  created_at: string;
}

interface Cohort {
  id: string;
  name: string;
}

interface ReferralsTabProps {
  referrals: Referral[];
  cohorts: Cohort[];
  onUpdateStatus: (referralId: string, status: string, cohortId?: string) => Promise<void>;
  onRefresh: () => void;
}

export default function ReferralsTab({ referrals, cohorts, onUpdateStatus, onRefresh }: ReferralsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [selectedCohortId, setSelectedCohortId] = useState<string>("");

  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.mother_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      referral.mother_phone.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (referralId: string, status: string, cohortId?: string) => {
    await onUpdateStatus(referralId, status, cohortId);
    setSelectedReferral(null);
    onRefresh();
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-bold text-gray-900">
            All Referrals ({referrals.length})
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search referrals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
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
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mother</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredReferrals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No referrals found
                </td>
              </tr>
            ) : (
              filteredReferrals.map((referral) => (
                <tr key={referral.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {referral.mother_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {referral.mother_phone}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(referral.estimated_due_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {referral.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedReferral(referral);
                        setSelectedCohortId(referral.partner_id || "");
                      }}
                      className="text-xs capitalize text-(--color-accent) hover:text-(--color-primary)"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign/Review Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-2xl font-bold text-gray-900">Referral Details</h3>
              <button onClick={() => setSelectedReferral(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Mother Name</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-900">{selectedReferral.mother_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estimated Due Date</p>
                <p className="font-medium text-gray-900">
                  {new Date(selectedReferral.estimated_due_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                  {selectedReferral.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assign to Cohort</p>
                <select
                  id="cohort-select"
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                >
                  <option value="">Select a cohort...</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleUpdateStatus(selectedReferral.id, "approved", selectedCohortId || undefined)}
                className="flex-1 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90"
              >
                Approve & Assign
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedReferral.id, "rejected")}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => setSelectedReferral(null)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
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
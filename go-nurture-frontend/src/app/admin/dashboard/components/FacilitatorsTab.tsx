"use client";

import { useState } from "react";
import { Plus, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";

interface Facilitator {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface FacilitatorsTabProps {
  facilitators: Facilitator[];
  onCreateFacilitator: (data: { name: string; email: string; phone: string }) => Promise<void>;
  onRefresh: () => void;
}

export default function FacilitatorsTab({ facilitators, onCreateFacilitator, onRefresh }: FacilitatorsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(facilitators.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = facilitators.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateFacilitator({ name, email, phone });
      toast.success("Facilitator created — invite email sent");
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error("Failed to create facilitator" + (error instanceof Error ? `: ${error.message}` : ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Facilitators ({facilitators.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto"
        >
          <Plus size={18} /> New Facilitator
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">Create New Facilitator</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Smith" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.org" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01603 123456" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">An invite email will be sent so they can set their password.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 disabled:opacity-50 inline-flex items-center justify-center gap-2 sm:w-auto">
              {submitting && <Loader2 size={16} className="animate-spin" />} Create & Send Invite
            </button>
            <button type="button" onClick={resetForm} className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 sm:w-auto">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No facilitators yet.
                </td>
              </tr>
            ) : (
              visible.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{f.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.phone || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      !f.is_active
                        ? "bg-red-50 text-red-700"
                        : f.is_verified
                          ? "bg-green-50 text-green-700"
                          : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {!f.is_active ? "Inactive" : f.is_verified ? "Active" : "Pending"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={facilitators.length} onPageChange={setPage} />
    </div>
  );
}
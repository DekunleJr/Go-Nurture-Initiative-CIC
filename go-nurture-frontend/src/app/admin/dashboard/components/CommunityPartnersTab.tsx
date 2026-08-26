"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";

interface CommunityPartner {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

interface CommunityPartnersTabProps {
  partners: CommunityPartner[];
  onCreatePartner: (name: string) => Promise<void>;
  onUpdatePartner: (partnerId: string, name: string) => Promise<void>;
  onDeletePartner: (partnerId: string) => Promise<void>;
  onToggleStatus: (partnerId: string, isActive: boolean) => Promise<void>;
  onRefresh: () => void;
}

const PAGE_SIZE = 10;

export default function CommunityPartnersTab({
  partners,
  onCreatePartner,
  onUpdatePartner,
  onDeletePartner,
  onToggleStatus,
  onRefresh,
}: CommunityPartnersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(partners.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visiblePartners = partners.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setPartnerName("");
    setEditMode(false);
    setEditingPartnerId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partnerName.trim()) {
      toast.error("Please enter a partner name");
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && editingPartnerId) {
        await onUpdatePartner(editingPartnerId, partnerName.trim());
        toast.success("Partner updated successfully");
      } else {
        await onCreatePartner(partnerName.trim());
        toast.success("Partner created successfully");
      }
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (error) {
      toast.error(
        editMode
          ? "Failed to update partner"
          : "Failed to create partner" + (error instanceof Error ? `: ${error.message}` : "")
      );
    } finally { setSubmitting(false); }
  };

  const handleEdit = (partner: CommunityPartner) => {
    setEditMode(true);
    setEditingPartnerId(partner.id);
    setPartnerName(partner.name);
    setShowForm(true);
  };

  const handleToggle = async (partner: CommunityPartner) => {
    setTogglingId(partner.id);
    try {
      await onToggleStatus(partner.id, !partner.is_active);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm("Are you sure you want to remove this partner?")) return;
    try {
      await onDeletePartner(partnerId);
      toast.success("Partner removed successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to remove partner" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--color-border) flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Community Partners ({partners.length})
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto"
        >
          <Plus size={18} />
          New Partner
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-(--color-border) bg-(--color-bg-sage)">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">
            {editMode ? "Edit Partner" : "Add New Partner"}
          </h4>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Partner Name *</label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="e.g., NHS Norfolk & Waveney"
              className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              required
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <><Loader2 size={16} className="animate-spin" /> {editMode ? "Saving..." : "Creating..."}</> : (editMode ? "Update Partner" : "Create Partner")}
            </button>
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:w-auto"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Partners List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--color-border)">
          <thead className="bg-(--color-bg-sage)">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Date Added</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {visiblePartners.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-(--color-text-muted)">
                  No community partners found.
                </td>
              </tr>
            ) : (
              visiblePartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-(--color-bg-sage)">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{partner.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        partner.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {partner.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => handleToggle(partner)}
                        disabled={togglingId === partner.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-accent) focus:ring-offset-2 disabled:opacity-60 ${
                          partner.is_active ? "bg-(--color-accent)" : "bg-gray-300"
                        }`}
                        title={partner.is_active ? "Deactivate partner" : "Activate partner"}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                          partner.is_active ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                    {new Date(partner.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(partner)}
                        className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit partner"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        className="inline-flex items-center justify-center p-1 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete partner"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={partners.length} onPageChange={setPage} />
    </div>
  );
}

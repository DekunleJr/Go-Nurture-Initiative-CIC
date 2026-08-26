"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Mail, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Pagination from "./Pagination";

interface Partner {
  id: string;
  organisation_name: string;
  contact_name: string;
  email: string;
  phone: string;
  organisation_type: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
}

interface PartnersTabProps {
  partners: Partner[];
  onActivate: (partnerId: string) => Promise<void>;
  onDeactivate: (partnerId: string) => Promise<void>;
  onCreatePartner: (partnerData: {
    organisation_name: string;
    contact_name: string;
    email: string;
    phone: string;
    organisation_type: string;
  }) => Promise<void>;
  onUpdatePartner: (partnerId: string, updateData: {
    organisation_name?: string;
    contact_name?: string;
    phone?: string;
    organisation_type?: string;
    is_admin?: boolean;
  }) => Promise<void>;
  onResendInvite: (partnerId: string) => Promise<void>;
  onRefresh: () => void;
}

export default function PartnersTab({ partners, onActivate, onDeactivate, onCreatePartner, onUpdatePartner, onResendInvite, onRefresh }: PartnersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] = useState("referral");
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resentAt, setResentAt] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);

  const COOLDOWN_MS = 5 * 60 * 1000;

  // Tick every second while any cooldown is active so countdowns stay live
  const hasCooldowns = Object.keys(resentAt).length > 0;
  useEffect(() => {
    if (!hasCooldowns) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [hasCooldowns]);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(partners.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visiblePartners = partners.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setOrgName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setOrgType("referral");
    setIsAdmin(false);
    setEditMode(false);
    setEditingPartnerId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgName || !contactName || !email || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && editingPartnerId) {
        await onUpdatePartner(editingPartnerId, {
          organisation_name: orgName,
          contact_name: contactName,
          phone,
          organisation_type: orgType,
          is_admin: isAdmin,
        });
        toast.success("Partner updated successfully");
      } else {
        await onCreatePartner({
          organisation_name: orgName,
          contact_name: contactName,
          email,
          phone,
          organisation_type: orgType,
        });
        toast.success("Partner created successfully - invite email sent");
      }
      resetForm();
      setShowForm(false);
      onRefresh();
    } catch (error) {
      toast.error(editMode ? "Failed to update partner" : "Failed to create partner" + (error instanceof Error ? `: ${error.message}` : ""));
    } finally { setSubmitting(false); }
  };

  const handleEdit = (partner: Partner) => {
    setEditMode(true);
    setEditingPartnerId(partner.id);
    setOrgName(partner.organisation_name || "");
    setContactName(partner.contact_name || "");
    setEmail(partner.email || "");
    setPhone(partner.phone || "");
    setOrgType(partner.organisation_type || "referral");
    setIsAdmin(partner.is_admin || false);
    setShowForm(true);
  };

  const handleActivate = async (partnerId: string) => {
    setStatusLoadingId(partnerId);
    try {
      await onActivate(partnerId);
      toast.success("Partner activated successfully");
    } catch (error) {
      toast.error("Failed to activate partner" + (error instanceof Error ? `: ${error.message}` : ""));
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleDeactivate = async (partnerId: string) => {
    setStatusLoadingId(partnerId);
    try {
      await onDeactivate(partnerId);
      toast.success("Partner deactivated successfully");
    } catch (error) {
      toast.error("Failed to deactivate partner" + (error instanceof Error ? `: ${error.message}` : ""));
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleResendInvite = async (partnerId: string) => {
    setResendingId(partnerId);
    try {
      await onResendInvite(partnerId);
      // Success: start the 5-minute cooldown for this partner
      // eslint-disable-next-line react-hooks/purity
      const timestamp = Date.now();
      setResentAt((prev) => ({ ...prev, [partnerId]: timestamp }));
      setNow(timestamp);
    } catch {
      // Error toast already shown by the handler in page.tsx — no cooldown on failure
    } finally {
      setResendingId(null);
    }
  };

  const getCooldownRemaining = (partnerId: string): number => {
    const sentAt = resentAt[partnerId];
    if (!sentAt) return 0;
    const remaining = COOLDOWN_MS - (now - sentAt);
    return remaining > 0 ? remaining : 0;
  };

  const formatCountdown = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--color-border) flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Partner Organisations ({partners.length})
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto"
        >
          <Plus size={18} />
          New Partner
        </button>
      </div>

      {/* Create/Edit Partner Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-(--color-border) bg-(--color-bg-sage)">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">
            {editMode ? "Edit Partner" : "Create New Partner"}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name *</label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Norfolk Community Health" className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g., Jane Smith" className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@organisation.org" className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required disabled={editMode} />
              {editMode && <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01603 123456" className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Type</label>
              <select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)">
                <option value="referral">Referral Partner</option>
                <option value="healthcare">Healthcare</option>
                <option value="community">Community Organisation</option>
                <option value="local_authority">Local Authority</option>
                <option value="other">Other</option>
              </select>
            </div>
            {editMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Access</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isAdmin" checked={isAdmin} onChange={() => setIsAdmin(true)} className="text-(--color-accent)" />
                    <span className="text-sm text-gray-700">Admin</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="isAdmin" checked={!isAdmin} onChange={() => setIsAdmin(false)} className="text-(--color-accent)" />
                    <span className="text-sm text-gray-700">Standard</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> {editMode ? "Saving..." : "Creating..."}</> : (editMode ? "Update Partner" : "Create Partner")}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:w-auto">Cancel</button>
          </div>
        </form>
      )}

      {/* Partners List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--color-border)">
          <thead className="bg-(--color-bg-sage)">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Organisation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {visiblePartners.map((partner) => (
              <tr key={partner.id} className="hover:bg-(--color-bg-sage)">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{partner.organisation_name}</td>
                <td className="px-6 py-4 text-sm text-(--color-text-muted)">{partner.contact_name}</td>
                <td className="px-6 py-4 text-sm text-(--color-text-muted)">{partner.email}</td>
                <td className="px-6 py-4 text-sm text-(--color-text-muted)">{partner.phone || "—"}</td>
                <td className="px-6 py-4 text-sm text-(--color-text-muted)">
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {partner.organisation_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${partner.is_admin ? "bg-purple-50 text-purple-700" : "bg-(--color-bg-sage) text-(--color-text-muted)"}`}>
                    {partner.is_admin ? "Admin" : "Standard"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    !partner.is_active
                      ? "bg-red-50 text-red-700"
                      : partner.is_verified
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                  }`}>
                    {!partner.is_active
                      ? "Inactive"
                      : partner.is_verified
                        ? "Active"
                        : "Pending"}
                  </span>
                </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleEdit(partner)} className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit partner">
                        <Pencil size={16} />
                      </button>
                      {partner.is_active && !partner.is_verified && (() => {
                        const isSending = resendingId === partner.id;
                        const cooldownMs = getCooldownRemaining(partner.id);
                        const isCoolingDown = cooldownMs > 0;
                        return (
                          <button
                            onClick={() => handleResendInvite(partner.id)}
                            disabled={isSending || isCoolingDown}
                            className={`inline-flex items-center gap-1 text-xs ${
                              isSending || isCoolingDown
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-(--color-accent) hover:text-(--color-accent-dark)"
                            }`}
                            title={isCoolingDown ? `You can resend again in ${formatCountdown(cooldownMs)}` : "Resend activation link"}
                          >
                            {isSending ? (
                              <>
                                <Loader2 size={14} className="animate-spin" /> Sending...
                              </>
                            ) : isCoolingDown ? (
                              <>
                                <Mail size={14} /> Resend Invite ({formatCountdown(cooldownMs)})
                              </>
                            ) : (
                              <>
                                <Mail size={14} /> Resend Invite
                              </>
                            )}
                          </button>
                        );
                      })()}
                      {partner.is_active ? (
                        <button onClick={() => handleDeactivate(partner.id)} disabled={statusLoadingId === partner.id} className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50">{statusLoadingId === partner.id && <Loader2 size={12} className="animate-spin" />} Deactivate</button>
                      ) : (
                        <button onClick={() => handleActivate(partner.id)} disabled={statusLoadingId === partner.id} className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 disabled:opacity-50">{statusLoadingId === partner.id && <Loader2 size={12} className="animate-spin" />} Activate</button>
                      )}
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageSize={PAGE_SIZE} total={partners.length} onPageChange={setPage} />
    </div>
  );
}

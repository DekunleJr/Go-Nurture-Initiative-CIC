"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import toast from "react-hot-toast";

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
  onRefresh: () => void;
}

export default function PartnersTab({ partners, onActivate, onDeactivate, onCreatePartner, onUpdatePartner, onRefresh }: PartnersTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgType, setOrgType] = useState("referral");
  const [isAdmin, setIsAdmin] = useState(false);

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
    }
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
    try {
      await onActivate(partnerId);
      toast.success("Partner activated successfully");
    } catch (error) {
      toast.error("Failed to activate partner" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  const handleDeactivate = async (partnerId: string) => {
    try {
      await onDeactivate(partnerId);
      toast.success("Partner deactivated successfully");
    } catch (error) {
      toast.error("Failed to deactivate partner" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Partner Organisations ({partners.length})
        </h3>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90"
        >
          <Plus size={18} />
          New Partner
        </button>
      </div>

      {/* Create/Edit Partner Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">
            {editMode ? "Edit Partner" : "Create New Partner"}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name *</label>
              <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g., Norfolk Community Health" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g., Jane Smith" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@organisation.org" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required disabled={editMode} />
              {editMode && <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01603 123456" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Type</label>
              <select value={orgType} onChange={(e) => setOrgType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)">
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
          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">
              {editMode ? "Update Partner" : "Create Partner"}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {/* Partners List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organisation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {partners.map((partner) => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{partner.organisation_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{partner.contact_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{partner.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{partner.phone || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {partner.organisation_type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${partner.is_admin ? "bg-purple-50 text-purple-700" : "bg-gray-50 text-gray-500"}`}>
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
                    {partner.is_active ? (
                      <button onClick={() => handleDeactivate(partner.id)} className="text-xs text-red-600 hover:text-red-700">Deactivate</button>
                    ) : (
                      <button onClick={() => handleActivate(partner.id)} className="text-xs text-green-600 hover:text-green-700">Activate</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
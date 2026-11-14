"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, Users, MapPin, UserCheck, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";
import Pagination from "./Pagination";

interface Venue {
  id: string;
  name: string;
}

interface FacilitatorOption {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

interface CohortMember {
  id: string;
  mother_name: string;
  mother_phone: string;
  estimated_due_date: string | null;
  status: string;
  language_requirement: string | null;
  requires_interpreter: boolean;
  created_at: string | null;
}

const COHORT_TYPES = [
  { value: "birth_confidence", label: "Free Antenatal Education" },
  { value: "breastfeeding_clinic", label: "Infant-Feeding Support" },
];

function cohortTypeLabel(type: string): string {
  return COHORT_TYPES.find((t) => t.value === type)?.label || type;
}

interface Cohort {
  id: string;
  name: string;
  year: number;
  cohort_type: string;
  start_date: string;
  end_date: string | null;
  max_participants: number;
  venue_name: string;
  venue_id: string | null;
  venue_address: string | null;
  venue_city: string | null;
  facilitator_name?: string | null;
  members: CohortMember[];
}

interface CohortsTabProps {
  cohorts: Cohort[];
  venues: Venue[];
  facilitators: FacilitatorOption[];
  onAssignFacilitator: (cohortId: string, facilitatorId: string) => Promise<void>;
  onCreateCohort: (cohortData: {
    name: string;
    year: number;
    cohort_type: string;
    start_date: string;
    end_date: string | null;
    max_participants: number;
    venue_id: string;
  }) => Promise<void>;
  onUpdateCohort: (
    cohortId: string,
    cohortData: {
      name: string;
      year: number;
      cohort_type: string;
      start_date: string;
      end_date: string | null;
      max_participants: number;
      venue_id: string;
    }
  ) => Promise<void>;
  onDeleteCohort: (cohortId: string) => Promise<void>;
  onRefresh: () => void;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <Users size={48} className="mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function CohortsTab({ cohorts, venues, facilitators, onAssignFacilitator, onCreateCohort, onUpdateCohort, onDeleteCohort, onRefresh }: CohortsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [viewingCohort, setViewingCohort] = useState<Cohort | null>(null);
  const [assigningCohort, setAssigningCohort] = useState<Cohort | null>(null);
  const [selectedFacilitatorId, setSelectedFacilitatorId] = useState("");
    const [assigning, setAssigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cohortName, setCohortName] = useState("");
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear());
  const [cohortType, setCohortType] = useState("birth_confidence");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cohortToDelete, setCohortToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(cohorts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleCohorts = cohorts.slice(start, start + PAGE_SIZE);

  const resetForm = () => {
    setCohortName("");
    setCohortYear(new Date().getFullYear());
    setCohortType("birth_confidence");
    setStartDate("");
    setEndDate("");
    setMaxParticipants(30);
    setSelectedVenueId("");
    setEditingCohort(null);
    setShowForm(false);
  };

  const handleEditClick = (cohort: Cohort) => {
    setEditingCohort(cohort);
    setCohortName(cohort.name);
    setCohortYear(cohort.year);
    setCohortType(cohort.cohort_type || "birth_confidence");
    setStartDate(cohort.start_date.slice(0, 10));
    setEndDate(cohort.end_date ? cohort.end_date.slice(0, 10) : "");
    setMaxParticipants(cohort.max_participants);
    setSelectedVenueId(cohort.venue_id || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isClinic = cohortType === "breastfeeding_clinic";
    if (!cohortName || !startDate || !selectedVenueId) { toast.error("Please fill in all required fields"); return; }
    if (!isClinic && !endDate) { toast.error("End date is required for Antenatal Education cohorts"); return; }
    setSubmitting(true);
    try {
      const cohortData = {
        name: cohortName,
        year: cohortYear,
        cohort_type: cohortType,
        start_date: startDate,
        end_date: isClinic ? null : endDate,
        max_participants: maxParticipants,
        venue_id: selectedVenueId,
      };
      if (editingCohort) { await onUpdateCohort(editingCohort.id, cohortData); toast.success("Cohort updated successfully"); }
      else { await onCreateCohort(cohortData); toast.success("Cohort created successfully"); }
      resetForm(); onRefresh();
    } catch { toast.error((editingCohort ? "Failed to update cohort" : "Failed to create cohort")); }
    finally { setSubmitting(false); }
  };

  const handleAssignClick = (cohort: Cohort) => {
    setAssigningCohort(cohort);
    setSelectedFacilitatorId("");
  };

  const handleAssignSubmit = async () => {
    if (!assigningCohort || !selectedFacilitatorId) return;
    setAssigning(true);
    try {
      await onAssignFacilitator(assigningCohort.id, selectedFacilitatorId);
      setAssigningCohort(null);
      onRefresh();
    } catch {
      // Error toast shown by handler in page.tsx
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteClick = (cohortId: string) => { setCohortToDelete(cohortId); setShowDeleteConfirm(true); };
  const handleDeleteConfirm = async () => {
    if (!cohortToDelete) return;
    setDeleting(true);
    try { await onDeleteCohort(cohortToDelete); toast.success("Cohort deleted successfully"); onRefresh(); }
    catch { toast.error("Failed to delete cohort"); }
    finally { setShowDeleteConfirm(false); setCohortToDelete(null); setDeleting(false); }
  };
  const handleDeleteCancel = () => { setShowDeleteConfirm(false); setCohortToDelete(null); };

  const venueLocation = (cohort: Cohort) => {
    const parts = [cohort.venue_address, cohort.venue_city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-(--color-border) overflow-hidden">
      <div className="px-6 py-4 border-b border-(--color-border) flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">Cohorts ({cohorts.length})</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto">
          <Plus size={18} /> New Cohort
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-(--color-border) bg-(--color-bg-sage)">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">{editingCohort ? "Edit Cohort" : "Create New Cohort"}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Name *</label>
              <input type="text" value={cohortName} onChange={(e) => setCohortName(e.target.value)} placeholder="e.g., Cohort 1 - Spring 2027" className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input type="number" value={cohortYear} onChange={(e) => setCohortYear(parseInt(e.target.value))} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Program Type *</label>
              <select value={cohortType} onChange={(e) => setCohortType(e.target.value)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)">
                {COHORT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
              {cohortType === "birth_confidence" && (
                <p className="mt-1 text-xs text-(--color-text-muted)">6 weekly classes — Class 1 starts on the start date, then weekly on the same day.</p>
              )}
              {cohortType === "breastfeeding_clinic" && (
                <p className="mt-1 text-xs text-(--color-text-muted)">Single appointment session — no end date needed.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date {cohortType !== "breastfeeding_clinic" && "*"}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={cohortType === "breastfeeding_clinic"}
                className={`w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent) ${cohortType === "breastfeeding_clinic" ? "bg-gray-100 cursor-not-allowed" : ""}`}
                required={cohortType !== "breastfeeding_clinic"}
              />
              {cohortType === "breastfeeding_clinic" && (
                <p className="mt-1 text-xs text-gray-400">Not applicable for the clinic type.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
              <select value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required>
                <option value="">Select a venue...</option>
                {venues.map((venue) => (<option key={venue.id} value={venue.id}>{venue.name}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90 sm:w-auto inline-flex items-center justify-center gap-2 disabled:opacity-50">{submitting ? <><Loader2 size={16} className="animate-spin" /> {editingCohort ? "Saving..." : "Creating..."}</> : (editingCohort ? "Save Changes" : "Create Cohort")}</button>
            <button type="button" onClick={resetForm} className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:w-auto">Cancel</button>
          </div>
        </form>
      )}

      {viewingCohort && (
        <div className="p-6 border-b border-(--color-border) bg-(--color-bg-sage)">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-heading text-lg font-bold text-gray-900">{viewingCohort.name}</h4>
              <p className="text-sm text-(--color-text-muted)">
                {viewingCohort.year} | {new Date(viewingCohort.start_date).toLocaleDateString()}
                {viewingCohort.end_date ? ` - ${new Date(viewingCohort.end_date).toLocaleDateString()}` : ""}
                {" · "}
                <span className="font-medium text-(--color-primary)">{cohortTypeLabel(viewingCohort.cohort_type)}</span>
              </p>
            </div>
            <button onClick={() => setViewingCohort(null)} className="rounded-lg border border-(--color-border) px-3 py-1 text-sm text-gray-700 hover:bg-(--color-bg-sage)">Close</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="rounded-lg bg-white p-4 border border-(--color-border)">
              <p className="text-xs font-medium text-(--color-text-muted) uppercase mb-1">Max Participants</p>
              <p className="text-lg font-semibold text-gray-900">{viewingCohort.max_participants}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-(--color-border)">
              <p className="text-xs font-medium text-(--color-text-muted) uppercase mb-1">Members</p>
              <p className="text-lg font-semibold text-gray-900">{viewingCohort.members.length}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-(--color-border)">
              <p className="text-xs font-medium text-(--color-text-muted) uppercase mb-1">Venue</p>
              <p className="text-sm font-semibold text-gray-900">{viewingCohort.venue_name || "-"}</p>
              {venueLocation(viewingCohort) && (<p className="text-xs text-(--color-text-muted) mt-1 flex items-center gap-1"><MapPin size={12} /> {venueLocation(viewingCohort)}</p>)}
            </div>
          </div>
          <h5 className="font-heading text-md font-bold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} className="text-(--color-accent)" /> People in this cohort ({viewingCohort.members.length})</h5>
          {viewingCohort.members.length === 0 ? (
            <p className="text-(--color-text-muted) text-sm py-6 text-center bg-white rounded-lg border border-(--color-border)">No members assigned to this cohort yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-(--color-border)">
              <table className="min-w-full divide-y divide-(--color-border) bg-white">
                <thead className="bg-(--color-bg-sage)">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Due Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-(--color-text-muted) uppercase">Interpreter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border)">
                  {viewingCohort.members.map((member) => (
                    <tr key={member.id} className="hover:bg-(--color-bg-sage)">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.mother_name}</td>
                      <td className="px-4 py-3 text-sm text-(--color-text-muted)">{member.mother_phone}</td>
                      <td className="px-4 py-3 text-sm text-(--color-text-muted)">{member.estimated_due_date ? new Date(member.estimated_due_date).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm"><span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{member.status}</span></td>
                      <td className="px-4 py-3 text-sm text-(--color-text-muted)">{member.requires_interpreter ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-(--color-border)">
          <thead className="bg-(--color-bg-sage)">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Program Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Max Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Facilitator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-(--color-text-muted) uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--color-border)">
            {visibleCohorts.length === 0 ? (
              <tr><td colSpan={9} className="px-6"><EmptyState message="No cohorts yet." /></td></tr>
            ) : (
              visibleCohorts.map((cohort) => (
                <tr key={cohort.id} className="hover:bg-(--color-bg-sage)">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cohort.name}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {cohortTypeLabel(cohort.cohort_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">{cohort.year}</td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">{new Date(cohort.start_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">{cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-sm text-(--color-text-muted)">{cohort.max_participants}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{cohort.venue_name || "-"}</div>
                    {venueLocation(cohort) && (<div className="text-xs text-(--color-text-muted) flex items-center gap-1"><MapPin size={12} /> {venueLocation(cohort)}</div>)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {cohort.facilitator_name ? (
                      <span className="inline-flex items-center gap-1 text-gray-700"><UserCheck size={14} /> {cohort.facilitator_name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingCohort(cohort)} className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg" title="View cohort details"><Eye size={16} /></button>
                      <button onClick={() => handleEditClick(cohort)} className="inline-flex items-center justify-center p-1 text-(--color-accent) hover:bg-(--color-accent)/10 rounded-lg" title="Edit cohort"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteClick(cohort.id)} className="inline-flex items-center justify-center p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete cohort"><Trash2 size={16} /></button>
                    </div>
                    <button
                      onClick={() => handleAssignClick(cohort)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:text-(--color-primary-dark)"
                    >
                      <UserCheck size={13} /> {cohort.facilitator_name ? "Change Facilitator" : "Assign Facilitator"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visibleCohorts.length > 0 && (<Pagination page={currentPage} pageSize={PAGE_SIZE} total={cohorts.length} onPageChange={setPage} />)}

      {/* Assign Facilitator Modal */}
      {assigningCohort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold text-gray-900">Assign Facilitator</h3>
              <button onClick={() => setAssigningCohort(null)} className="text-gray-400 hover:text-(--color-text-muted)"><X size={22} /></button>
            </div>
            <p className="text-sm text-(--color-text-muted) mb-1">Cohort:</p>
            <p className="font-medium text-gray-900 mb-4">{assigningCohort.name}</p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Select Facilitator *</label>
            <select
              value={selectedFacilitatorId}
              onChange={(e) => setSelectedFacilitatorId(e.target.value)}
              className="w-full rounded-lg border border-(--color-border) px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
            >
              <option value="">Choose a facilitator...</option>
              {facilitators.filter((f) => f.is_active).map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
              ))}
            </select>
            {facilitators.filter((f) => f.is_active).length === 0 && (
              <p className="mt-2 text-xs text-amber-600">No active facilitators yet — create one in the Facilitators tab first.</p>
            )}
            <p className="mt-2 text-xs text-(--color-text-muted)">The facilitator will be emailed the cohort details and class schedule.</p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={handleAssignSubmit}
                disabled={!selectedFacilitatorId || assigning}
                className="w-full rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-4 py-2 text-white hover:opacity-95 disabled:opacity-50 sm:flex-1"
              >
                {assigning ? "Assigning..." : "Assign & Email"}
              </button>
              <button onClick={() => setAssigningCohort(null)} className="w-full rounded-lg border border-(--color-border) px-4 py-2 text-gray-700 hover:bg-(--color-bg-sage) sm:flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={showDeleteConfirm} title="Delete Cohort" message="Are you sure you want to delete this cohort? This action cannot be undone." onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} loading={deleting} />
    </div>
  );
}




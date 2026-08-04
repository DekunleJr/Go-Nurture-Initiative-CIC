"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Eye, Users, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";
import Pagination from "./Pagination";

interface Venue {
  id: string;
  name: string;
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

interface Cohort {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  max_participants: number;
  venue_name: string;
  venue_id: string | null;
  venue_address: string | null;
  venue_city: string | null;
  members: CohortMember[];
}

interface CohortsTabProps {
  cohorts: Cohort[];
  venues: Venue[];
  onCreateCohort: (cohortData: {
    name: string;
    year: number;
    start_date: string;
    end_date: string;
    max_participants: number;
    venue_id: string;
  }) => Promise<void>;
  onUpdateCohort: (
    cohortId: string,
    cohortData: {
      name: string;
      year: number;
      start_date: string;
      end_date: string;
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

export default function CohortsTab({ cohorts, venues, onCreateCohort, onUpdateCohort, onDeleteCohort, onRefresh }: CohortsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [viewingCohort, setViewingCohort] = useState<Cohort | null>(null);
  const [cohortName, setCohortName] = useState("");
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear());
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
    setStartDate(cohort.start_date.slice(0, 10));
    setEndDate(cohort.end_date.slice(0, 10));
    setMaxParticipants(cohort.max_participants);
    setSelectedVenueId(cohort.venue_id || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cohortName || !startDate || !endDate || !selectedVenueId) { toast.error("Please fill in all required fields"); return; }
    try {
      const cohortData = { name: cohortName, year: cohortYear, start_date: startDate, end_date: endDate, max_participants: maxParticipants, venue_id: selectedVenueId };
      if (editingCohort) { await onUpdateCohort(editingCohort.id, cohortData); toast.success("Cohort updated successfully"); }
      else { await onCreateCohort(cohortData); toast.success("Cohort created successfully"); }
      resetForm(); onRefresh();
    } catch { toast.error((editingCohort ? "Failed to update cohort" : "Failed to create cohort")); }
  };

  const handleDeleteClick = (cohortId: string) => { setCohortToDelete(cohortId); setShowDeleteConfirm(true); };
  const handleDeleteConfirm = async () => {
    if (!cohortToDelete) return;
    try { await onDeleteCohort(cohortToDelete); toast.success("Cohort deleted successfully"); onRefresh(); }
    catch { toast.error("Failed to delete cohort"); }
    finally { setShowDeleteConfirm(false); setCohortToDelete(null); }
  };
  const handleDeleteCancel = () => { setShowDeleteConfirm(false); setCohortToDelete(null); };

  const venueLocation = (cohort: Cohort) => {
    const parts = [cohort.venue_address, cohort.venue_city].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">Cohorts ({cohorts.length})</h3>
        <button onClick={() => { if (showForm) resetForm(); else setShowForm(true); }} className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">
          <Plus size={18} /> New Cohort
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">{editingCohort ? "Edit Cohort" : "Create New Cohort"}</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cohort Name *</label>
              <input type="text" value={cohortName} onChange={(e) => setCohortName(e.target.value)} placeholder="e.g., Cohort 1 - Spring 2027" className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <input type="number" value={cohortYear} onChange={(e) => setCohortYear(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input type="number" value={maxParticipants} onChange={(e) => setMaxParticipants(parseInt(e.target.value))} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
              <select value={selectedVenueId} onChange={(e) => setSelectedVenueId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)" required>
                <option value="">Select a venue...</option>
                {venues.map((venue) => (<option key={venue.id} value={venue.id}>{venue.name}</option>))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90">{editingCohort ? "Save Changes" : "Create Cohort"}</button>
            <button type="button" onClick={resetForm} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      {viewingCohort && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-heading text-lg font-bold text-gray-900">{viewingCohort.name}</h4>
              <p className="text-sm text-gray-600">{viewingCohort.year} | {new Date(viewingCohort.start_date).toLocaleDateString()} - {new Date(viewingCohort.end_date).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setViewingCohort(null)} className="rounded-lg border border-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50">Close</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <div className="rounded-lg bg-white p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Max Participants</p>
              <p className="text-lg font-semibold text-gray-900">{viewingCohort.max_participants}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Members</p>
              <p className="text-lg font-semibold text-gray-900">{viewingCohort.members.length}</p>
            </div>
            <div className="rounded-lg bg-white p-4 border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Venue</p>
              <p className="text-sm font-semibold text-gray-900">{viewingCohort.venue_name || "-"}</p>
              {venueLocation(viewingCohort) && (<p className="text-xs text-gray-600 mt-1 flex items-center gap-1"><MapPin size={12} /> {venueLocation(viewingCohort)}</p>)}
            </div>
          </div>
          <h5 className="font-heading text-md font-bold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} className="text-(--color-accent)" /> People in this cohort ({viewingCohort.members.length})</h5>
          {viewingCohort.members.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center bg-white rounded-lg border border-gray-200">No members assigned to this cohort yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Interpreter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {viewingCohort.members.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.mother_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.mother_phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.estimated_due_date ? new Date(member.estimated_due_date).toLocaleDateString() : "-"}</td>
                      <td className="px-4 py-3 text-sm"><span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{member.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">{member.requires_interpreter ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Participants</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visibleCohorts.length === 0 ? (
              <tr><td colSpan={7} className="px-6"><EmptyState message="No cohorts yet." /></td></tr>
            ) : (
              visibleCohorts.map((cohort) => (
                <tr key={cohort.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{cohort.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cohort.year}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(cohort.start_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(cohort.end_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{cohort.max_participants}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{cohort.venue_name || "-"}</div>
                    {venueLocation(cohort) && (<div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={12} /> {venueLocation(cohort)}</div>)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingCohort(cohort)} className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg" title="View cohort details"><Eye size={16} /></button>
                      <button onClick={() => handleEditClick(cohort)} className="inline-flex items-center justify-center p-1 text-(--color-accent) hover:bg-(--color-accent)/10 rounded-lg" title="Edit cohort"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteClick(cohort.id)} className="inline-flex items-center justify-center p-1 text-red-600 hover:bg-red-50 rounded-lg" title="Delete cohort"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visibleCohorts.length > 0 && (<Pagination page={currentPage} pageSize={PAGE_SIZE} total={cohorts.length} onPageChange={setPage} />)}

      <ConfirmDialog isOpen={showDeleteConfirm} title="Delete Cohort" message="Are you sure you want to delete this cohort? This action cannot be undone." onConfirm={handleDeleteConfirm} onCancel={handleDeleteCancel} />
    </div>
  );
}
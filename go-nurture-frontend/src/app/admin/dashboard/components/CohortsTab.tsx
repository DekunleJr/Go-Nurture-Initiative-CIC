"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

interface Venue {
  id: string;
  name: string;
}

interface Cohort {
  id: string;
  name: string;
  year: number;
  start_date: string;
  end_date: string;
  max_participants: number;
  venue_name: string;
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
  onRefresh: () => void;
}

export default function CohortsTab({ cohorts, venues, onCreateCohort, onRefresh }: CohortsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [cohortName, setCohortName] = useState("");
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [selectedVenueId, setSelectedVenueId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cohortName || !startDate || !endDate || !selectedVenueId) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await onCreateCohort({
        name: cohortName,
        year: cohortYear,
        start_date: startDate,
        end_date: endDate,
        max_participants: maxParticipants,
        venue_id: selectedVenueId,
      });
      
      // Reset form
      setCohortName("");
      setCohortYear(new Date().getFullYear());
      setStartDate("");
      setEndDate("");
      setMaxParticipants(30);
      setSelectedVenueId("");
      setShowForm(false);
      toast.success("Cohort created successfully");
      onRefresh();
    } catch (error) {
      toast.error("Failed to create cohort" + (error instanceof Error ? `: ${error.message}` : ""));
    }
  };

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">
          Cohorts ({cohorts.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90"
        >
          <Plus size={18} />
          New Cohort
        </button>
      </div>

      {/* Create Cohort Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-heading text-lg font-bold text-gray-900 mb-4">Create New Cohort</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cohort Name *
              </label>
              <input
                type="text"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                placeholder="e.g., Cohort 1 - Spring 2027"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year *
              </label>
              <input
                type="number"
                value={cohortYear}
                onChange={(e) => setCohortYear(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Venue *
              </label>
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
                required
              >
                <option value="">Select a venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-(--color-accent) px-4 py-2 text-white hover:bg-(--color-accent)/90"
            >
              Create Cohort
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Cohorts List */}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {cohorts.map((cohort) => (
              <tr key={cohort.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{cohort.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{cohort.year}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(cohort.start_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(cohort.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{cohort.max_participants}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{cohort.venue_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
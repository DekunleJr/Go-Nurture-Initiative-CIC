"use client";

import { useState } from "react";
import { FileText, CalendarDays, UserCheck, Search, Eye } from "lucide-react";
import Pagination from "./Pagination";

interface SessionReview {
  id: string;
  cohort_id: string;
  facilitator_id: string;
  session_date: string;
  week_number: number | null;
  mode: string | null;
  venue_or_platform: string | null;
  lead_facilitator: string | null;
  co_facilitator: string | null;
  start_time: string | null;
  finish_time: string | null;
  registered_count: number | null;
  attended_count: number | null;
  supporter_count: number | null;
  reasonable_adjustments: string | null;
  fidelity_checked: string[] | null;
  quality_ratings: Record<string, { score: number; comment: string }> | null;
  deviations: string | null;
  incidents: Array<Record<string, string>> | null;
  reflection: Record<string, string> | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  cohort_name: string | null;
  facilitator_name: string | null;
}

interface Props {
  reviews: SessionReview[];
}

const MODE_LABELS: Record<string, string> = {
  face_to_face: "Face-to-face",
  online: "Online",
  hybrid: "Hybrid",
};

export default function SessionReviewsTab({ reviews }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<SessionReview | null>(null);

  const PAGE_SIZE = 10;
  const filtered = reviews.filter(
    (r) =>
      (r.cohort_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.facilitator_name || "").toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-heading text-xl font-bold text-gray-900">Session Reviews ({reviews.length})</h3>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by cohort or facilitator..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-gray-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cohort</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Facilitator</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No session reviews found.
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.cohort_name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.facilitator_name || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(r.session_date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{MODE_LABELS[r.mode || ""] || r.mode || "-"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      r.status === "submitted"
                        ? "bg-green-50 text-green-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {r.status === "submitted" ? "Submitted" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setViewing(r)}
                      className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="View review"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {visible.length > 0 && (
        <Pagination page={currentPage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
      )}

      {/* Read-only detail viewer */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-3xl rounded-xl bg-white p-6 shadow-xl my-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-heading text-2xl font-bold text-gray-900">Session Review</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {viewing.cohort_name} · {viewing.facilitator_name}
                </p>
              </div>
              <button onClick={() => setViewing(null)} className="text-gray-400 hover:text-gray-600">
                <FileText size={24} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-2"><CalendarDays size={14} className="text-gray-400" /> <span className="font-medium">Date:</span> {formatDate(viewing.session_date)}</div>
              <div><span className="font-medium">Mode:</span> {MODE_LABELS[viewing.mode || ""] || viewing.mode || "-"}</div>
              <div><span className="font-medium">Venue/Platform:</span> {viewing.venue_or_platform || "-"}</div>
              <div><span className="font-medium">Lead Facilitator:</span> {viewing.lead_facilitator || "-"}</div>
              <div><span className="font-medium">Co-facilitator:</span> {viewing.co_facilitator || "-"}</div>
              <div><span className="font-medium">Time:</span> {viewing.start_time || "-"} to {viewing.finish_time || "-"}</div>
              <div><span className="font-medium">Registered:</span> {viewing.registered_count ?? "-"}</div>
              <div><span className="font-medium">Attended:</span> {viewing.attended_count ?? "-"}</div>
              <div><span className="font-medium">Supporters:</span> {viewing.supporter_count ?? "-"}</div>
            </div>

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Reasonable Adjustments</h4>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewing.reasonable_adjustments || "None recorded."}</p>

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Fidelity Checklist</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              {(viewing.fidelity_checked || []).map((item, i) => (
                <li key={i} className="flex items-start gap-2"><span className="text-green-600">✓</span> {item}</li>
              ))}
              {(viewing.fidelity_checked || []).length === 0 && <li className="text-gray-400">No items checked.</li>}
            </ul>

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Quality Dashboard</h4>
            <div className="space-y-2 text-sm">
              {Object.entries(viewing.quality_ratings || {}).map(([measure, val]) => (
                <div key={measure} className="flex items-start gap-3">
                  <span className="w-56 font-medium text-gray-700">{measure}</span>
                  <span className="text-gray-600">Score: {val.score}/5</span>
                  {val.comment && <span className="text-gray-600">— {val.comment}</span>}
                </div>
              ))}
              {Object.keys(viewing.quality_ratings || {}).length === 0 && <p className="text-gray-400">No ratings recorded.</p>}
            </div>

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Deviations</h4>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewing.deviations || "None recorded."}</p>

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Incidents</h4>
            {(viewing.incidents || []).length === 0 ? (
              <p className="text-sm text-gray-400">No incidents recorded.</p>
            ) : (
              <div className="space-y-2">
                {(viewing.incidents || []).map((inc, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-3 text-sm">
                    <div><span className="font-medium">Ref/ID:</span> {inc.ref || "-"}</div>
                    <div><span className="font-medium">Type:</span> {inc.type || "-"}</div>
                    <div><span className="font-medium">Action:</span> {inc.action || "-"}</div>
                    <div><span className="font-medium">Escalated to:</span> {inc.escalated_to || "-"}</div>
                    <div><span className="font-medium">Closed:</span> {inc.closed_at || "-"}</div>
                  </div>
                ))}
              </div>
            )}

            <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Facilitator Reflection</h4>
            <div className="space-y-3 text-sm">
              {Object.entries(viewing.reflection || {}).map(([q, a]) => (
                <div key={q}>
                  <span className="font-medium text-gray-700">{q}</span>
                  <p className="mt-1 text-gray-600 bg-gray-50 rounded-lg p-3">{a || "—"}</p>
                </div>
              ))}
              {Object.keys(viewing.reflection || {}).length === 0 && <p className="text-gray-400">No reflection recorded.</p>}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

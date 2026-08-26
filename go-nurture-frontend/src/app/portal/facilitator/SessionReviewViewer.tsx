"use client";

import { X, CalendarDays } from "lucide-react";
import type { SessionReview } from "@/types/api";

interface Props {
  review: SessionReview;
  onClose: () => void;
}

const MODE_LABELS: Record<string, string> = {
  face_to_face: "Face-to-face",
  online: "Online",
  hybrid: "Hybrid",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function SessionReviewViewer({ review, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl my-8 overflow-hidden animate-scale-in">
        {/* Modal header */}
        <div className="relative overflow-hidden bg-(--color-primary) bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) px-6 py-5 text-white">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-10 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-(--color-accent-light)/30 blur-2xl" />
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-2xl font-bold">Session Review</h3>
              <p className="mt-1 text-sm text-white/80">
                {review.cohort_name || "Cohort"} · {review.facilitator_name}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  review.status === "submitted"
                    ? "bg-green-500/90 text-white"
                    : "bg-yellow-400/90 text-yellow-900"
                }`}
              >
                {review.status === "submitted" ? "Submitted" : "Draft"}
              </span>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white">
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-gray-400" />
            <span className="font-medium">Date:</span> {formatDate(review.session_date)}
          </div>
          <div><span className="font-medium">Mode:</span> {MODE_LABELS[review.mode || ""] || review.mode || "-"}</div>
          <div><span className="font-medium">Week:</span> {review.week_number ?? "-"}</div>
          <div><span className="font-medium">Venue/Platform:</span> {review.venue_or_platform || "-"}</div>
          <div><span className="font-medium">Lead Facilitator:</span> {review.lead_facilitator || "-"}</div>
          <div><span className="font-medium">Co-facilitator:</span> {review.co_facilitator || "-"}</div>
          <div><span className="font-medium">Time:</span> {review.start_time || "-"} to {review.finish_time || "-"}</div>
          <div><span className="font-medium">Registered:</span> {review.registered_count ?? "-"}</div>
          <div><span className="font-medium">Attended:</span> {review.attended_count ?? "-"}</div>
          <div><span className="font-medium">Supporters:</span> {review.supporter_count ?? "-"}</div>
        </div>
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Reasonable Adjustments</h4>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{review.reasonable_adjustments || "None recorded."}</p>

        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Fidelity Checklist</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          {(review.fidelity_checked || []).map((item, i) => (
            <li key={i} className="flex items-start gap-2"><span className="text-green-600">✓</span> {item}</li>
          ))}
          {(review.fidelity_checked || []).length === 0 && <li className="text-gray-400">No items checked.</li>}
        </ul>

        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Quality Dashboard</h4>
        <div className="space-y-2 text-sm">
          {Object.entries(review.quality_ratings || {}).map(([measure, val]) => (
            <div key={measure} className="flex items-start gap-3">
              <span className="w-56 font-medium text-gray-700">{measure}</span>
              <span className="text-gray-600">Score: {val.score}/5</span>
              {val.comment && <span className="text-gray-600">— {val.comment}</span>}
            </div>
          ))}
          {Object.keys(review.quality_ratings || {}).length === 0 && <p className="text-gray-400">No ratings recorded.</p>}
        </div>

        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Deviations</h4>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{review.deviations || "None recorded."}</p>

        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-2">Incidents</h4>
        {(review.incidents || []).length === 0 ? (
          <p className="text-sm text-gray-400">No incidents recorded.</p>
        ) : (
          <div className="space-y-2">
            {(review.incidents || []).map((inc, i) => (
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
          {Object.entries(review.reflection || {}).map(([q, a]) => (
            <div key={q}>
              <span className="font-medium text-gray-700">{q}</span>
              <p className="mt-1 text-gray-600 bg-gray-50 rounded-lg p-3">{a || "—"}</p>
            </div>
          ))}
          {Object.keys(review.reflection || {}).length === 0 && <p className="text-gray-400">No reflection recorded.</p>}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--color-border) px-4 py-2 text-sm text-gray-700 hover:bg-(--color-bg-sage)"
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
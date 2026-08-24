"use client";

import { useState } from "react";
import { X, Loader2, Save, Send } from "lucide-react";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const FIDELITY_ITEMS = [
  "Current slides, manual, participant resources and evidence log used.",
  "Local maternity, neonatal, mental-health, safeguarding and emergency routes verified.",
  "Welcome, confidentiality, opt-out and educational scope completed.",
  "Birth confidence framed as understanding and adapting, not avoiding intervention.",
  "Induction taught as a variable process with possible stages and reassessment.",
  "Assisted vaginal birth explained without graphic or failure-based language.",
  "Caesarean birth, anaesthesia, theatre and recovery covered accurately.",
  "NICU / extra care taught with continued parental involvement.",
  "Ten-minute break and private-question route provided.",
  "Trauma-aware and displacement-sensitive standards maintained.",
  "VOICE™ wording taught correctly; BRAIN shown within O.",
  "Anchor and Witness partner role integrated without takeover.",
  "All planned Week 4 activities delivered or an approved adaptation recorded.",
  "Essential Resource Card update explained and supported.",
  "No individual diagnosis, treatment, legal or immigration advice given.",
  "Assessment and course-delivery evaluation returned or follow-up arranged.",
];

const QUALITY_MEASURES = [
  "Timing and flow",
  "Participant engagement",
  "Clinical clarity",
  "Intervention neutrality",
  "VOICE™ delivery",
  "Partner integration",
  "Trauma-aware safety",
  "Cultural / language inclusion",
  "Venue / technology",
  "Resource quality",
  "Facilitator confidence",
];

const REFLECTION_QUESTIONS = [
  "What worked well?",
  "What was unclear, sensitive or difficult?",
  "Which questions or misconceptions recurred?",
  "Where did timing change?",
  "How did participants respond to intervention and NICU content?",
  "What should improve before the next cohort?",
  "Priority action before next delivery",
];

interface Props {
  cohortId: string;
  cohortName: string;
  schedulePreview: string;
  onClose: () => void;
}

export default function SessionReviewForm({ cohortId, cohortName, schedulePreview, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    session_date: "",
    week_number: 4,
    mode: "face_to_face",
    venue_or_platform: "",
    lead_facilitator: "",
    co_facilitator: "",
    start_time: "",
    finish_time: "",
    registered_count: 0,
    attended_count: 0,
    supporter_count: 0,
    reasonable_adjustments: "",
    deviations: "",
  });
  const [fidelity, setFidelity] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, { score: number; comment: string }>>({});
  const [incidents, setIncidents] = useState<{ ref: string; type: string; action: string; escalated_to: string; closed_at: string }[]>([]);
  const [reflection, setReflection] = useState<Record<string, string>>({});

  const setField = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (status: "draft" | "submitted") => {
    if (!form.session_date) {
      toast.error("Session date is required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/api/facilitator/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          cohort_id: cohortId,
          session_date: new Date(form.session_date + "T00:00:00Z").toISOString(),
          week_number: form.week_number,
          mode: form.mode,
          venue_or_platform: form.venue_or_platform,
          lead_facilitator: form.lead_facilitator,
          co_facilitator: form.co_facilitator,
          start_time: form.start_time,
          finish_time: form.finish_time,
          registered_count: form.registered_count,
          attended_count: form.attended_count,
          supporter_count: form.supporter_count,
          reasonable_adjustments: form.reasonable_adjustments,
          fidelity_checked: fidelity,
          quality_ratings: ratings,
          deviations: form.deviations,
          incidents,
          reflection,
          status,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to save review");
      }
      toast.success(status === "submitted" ? "Review submitted" : "Draft saved");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl my-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading text-2xl font-bold text-gray-900">Session Review — {cohortName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{schedulePreview}</p>

        {/* Delivery record */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-6 mb-3">1. Delivery Record</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Date *</label>
            <input type="date" required value={form.session_date} onChange={(e) => setField("session_date", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
            <select value={form.mode} onChange={(e) => setField("mode", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2">
              <option value="face_to_face">Face-to-face</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Platform</label>
            <input type="text" value={form.venue_or_platform} onChange={(e) => setField("venue_or_platform", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Facilitator</label>
            <input type="text" value={form.lead_facilitator} onChange={(e) => setField("lead_facilitator", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Co-facilitator / Interpreter</label>
            <input type="text" value={form.co_facilitator} onChange={(e) => setField("co_facilitator", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start / Finish Time</label>
            <div className="flex gap-2">
              <input type="time" value={form.start_time} onChange={(e) => setField("start_time", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
              <input type="time" value={form.finish_time} onChange={(e) => setField("finish_time", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered</label>
            <input type="number" value={form.registered_count} onChange={(e) => setField("registered_count", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attended</label>
            <input type="number" value={form.attended_count} onChange={(e) => setField("attended_count", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supporters</label>
            <input type="number" value={form.supporter_count} onChange={(e) => setField("supporter_count", parseInt(e.target.value) || 0)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reasonable Adjustments and Support</label>
            <textarea rows={2} value={form.reasonable_adjustments} onChange={(e) => setField("reasonable_adjustments", e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </div>
        </div>

        {/* Fidelity checklist */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-8 mb-3">2. Delivery Fidelity Checklist</h4>
        <div className="space-y-2">
          {FIDELITY_ITEMS.map((item) => (
            <label key={item} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                checked={fidelity.includes(item)}
                onChange={(e) =>
                  setFidelity((prev) =>
                    e.target.checked ? [...prev, item] : prev.filter((f) => f !== item)
                  )
                }
              />
              <span>{item}</span>
            </label>
          ))}
        </div>

        {/* Quality ratings */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-8 mb-3">3. Quality Dashboard (1–5)</h4>
        <div className="space-y-4">
          {QUALITY_MEASURES.map((measure) => (
            <div key={measure} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <span className="w-64 text-sm font-medium text-gray-700">{measure}</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRatings((prev) => ({ ...prev, [measure]: { ...prev[measure], score: n } }))}
                    className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                      ratings[measure]?.score === n
                        ? "bg-(--color-primary) text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Comment (optional)"
                value={ratings[measure]?.comment || ""}
                onChange={(e) => setRatings((prev) => ({ ...prev, [measure]: { ...prev[measure], score: prev[measure]?.score || 1, comment: e.target.value } }))}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600"
              />
            </div>
          ))}
        </div>

        {/* Deviations */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-8 mb-3">4. Deviations from Locked Delivery</h4>
        <textarea rows={3} value={form.deviations} onChange={(e) => setField("deviations", e.target.value)} placeholder="Record omitted, shortened, reordered or substantially adapted content and the reason" className="w-full rounded-lg border border-gray-200 px-3 py-2" />

        {/* Incidents */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-8 mb-3">5. Incidents</h4>
        {incidents.map((inc, i) => (
          <div key={i} className="mb-3 grid gap-2 sm:grid-cols-2 rounded-lg border border-gray-200 p-3">
            <input type="text" placeholder="Ref/ID" value={inc.ref} onChange={(e) => setIncidents((prev) => prev.map((p, j) => j === i ? { ...p, ref: e.target.value } : p))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <input type="text" placeholder="Type" value={inc.type} onChange={(e) => setIncidents((prev) => prev.map((p, j) => j === i ? { ...p, type: e.target.value } : p))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <input type="text" placeholder="Action taken" value={inc.action} onChange={(e) => setIncidents((prev) => prev.map((p, j) => j === i ? { ...p, action: e.target.value } : p))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2" />
            <input type="text" placeholder="Escalated to" value={inc.escalated_to} onChange={(e) => setIncidents((prev) => prev.map((p, j) => j === i ? { ...p, escalated_to: e.target.value } : p))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            <input type="text" placeholder="Closed date" value={inc.closed_at} onChange={(e) => setIncidents((prev) => prev.map((p, j) => j === i ? { ...p, closed_at: e.target.value } : p))} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </div>
        ))}
        <button type="button" onClick={() => setIncidents((prev) => [...prev, { ref: "", type: "", action: "", escalated_to: "", closed_at: "" }])} className="text-sm text-(--color-accent) hover:text-(--color-accent-dark)">+ Add incident</button>

        {/* Reflection */}
        <h4 className="font-heading text-lg font-bold text-(--color-primary) mt-8 mb-3">6. Facilitator Reflection</h4>
        <div className="space-y-3">
          {REFLECTION_QUESTIONS.map((q) => (
            <div key={q}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{q}</label>
              <textarea rows={2} value={reflection[q] || ""} onChange={(e) => setReflection((prev) => ({ ...prev, [q]: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <button type="button" disabled={saving} onClick={() => submit("draft")} className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2 sm:flex-1">
            <Save size={16} /> Save Draft
          </button>
          <button type="button" disabled={saving} onClick={() => submit("submitted")} className="w-full rounded-lg bg-(--color-primary) px-4 py-2 text-white hover:bg-(--color-primary)/90 inline-flex items-center justify-center gap-2 disabled:opacity-50 sm:flex-1">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Review
          </button>
          <button type="button" onClick={onClose} className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-50 sm:flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}
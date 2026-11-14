"use client";

import { createContext, useContext, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import toast from "react-hot-toast";

export interface ReferralDetails {
  id: string;
  reference_number?: string | null;
  status: string;
  created_at: string;
  partner_name: string | null;
  cohort_name: string | null;
  clinic_cohort_name?: string | null;
  venue_name: string | null;

  referrer_name?: string | null;
  referrer_email?: string | null;
  referrer_phone?: string | null;

  mother_name: string;
  preferred_name?: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  safe_contact_method?: string | null;
  voicemail_ok?: string | null;
  communication_restrictions?: string | null;
  locality?: string | null;
  postcode_area?: string | null;

  referral_type?: string;
  estimated_due_date: string | null;
  gestation_info?: string | null;
  can_attend_course?: string | null;
  timing_notes?: string | null;
  baby_born?: string | null;
  baby_age_or_due?: string | null;
  preferred_appointment_timing?: string | null;

  barriers?: string[] | null;
  barriers_other?: string | null;
  additional_notes: string | null;

  interpreter_support?: string | null;
  requires_interpreter: boolean;
  language_requirement: string | null;
  adjustments_needed?: string | null;

  consent_obtained?: boolean;
}

const SERVICES = [
  { value: "birth_confidence", label: "Antenatal education" },
  { value: "breastfeeding_clinic", label: "Infant-feeding clinic" },
  { value: "both", label: "Both" },
];

const BARRIER_OPTIONS = [
  { value: "affordability", label: "Affordability" },
  { value: "language", label: "Language or communication" },
  { value: "migration", label: "Migration or displacement-related access" },
  { value: "isolation", label: "Isolation" },
  { value: "service_access", label: "Difficulty accessing services" },
  { value: "disability", label: "Disability or accessibility needs" },
  { value: "housing", label: "Housing instability" },
  { value: "other", label: "Other (please specify)" },
];

const CONTACT_OPTS = [
  { value: "telephone", label: "Telephone" },
  { value: "email", label: "Email" },
  { value: "either", label: "Either" },
];
const YES_NO_NOT_SURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];
const YES_NO_UNSURE = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unsure", label: "Unsure" },
];
const YES_NO_NOT_KNOWN = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_known", label: "Not known" },
];

type Opt = { value: string; label: string };

/** Form state: every text answer is a string ("" = not provided). */
interface Draft {
  referrer_name: string;
  referrer_email: string;
  referrer_phone: string;
  mother_name: string;
  preferred_name: string;
  mother_phone: string;
  mother_email: string;
  safe_contact_method: string;
  voicemail_ok: string;
  communication_restrictions: string;
  locality: string;
  postcode_area: string;
  referral_type: string;
  estimated_due_date: string;
  gestation_info: string;
  can_attend_course: string;
  timing_notes: string;
  baby_born: string;
  baby_age_or_due: string;
  preferred_appointment_timing: string;
  barriers: string[];
  barriers_other: string;
  additional_notes: string;
  interpreter_support: string;
  language_requirement: string;
  adjustments_needed: string;
}

function toDraft(r: ReferralDetails): Draft {
  const s = (v?: string | null) => v ?? "";
  return {
    referrer_name: s(r.referrer_name),
    referrer_email: s(r.referrer_email),
    referrer_phone: s(r.referrer_phone),
    mother_name: s(r.mother_name),
    preferred_name: s(r.preferred_name),
    mother_phone: s(r.mother_phone),
    mother_email: s(r.mother_email),
    safe_contact_method: s(r.safe_contact_method),
    voicemail_ok: s(r.voicemail_ok),
    communication_restrictions: s(r.communication_restrictions),
    locality: s(r.locality),
    postcode_area: s(r.postcode_area),
    referral_type: r.referral_type ?? "birth_confidence",
    estimated_due_date: s(r.estimated_due_date).slice(0, 10),
    gestation_info: s(r.gestation_info),
    can_attend_course: s(r.can_attend_course),
    timing_notes: s(r.timing_notes),
    baby_born: s(r.baby_born),
    baby_age_or_due: s(r.baby_age_or_due),
    preferred_appointment_timing: s(r.preferred_appointment_timing),
    barriers: r.barriers ?? [],
    barriers_other: s(r.barriers_other),
    additional_notes: s(r.additional_notes),
    interpreter_support: r.interpreter_support ?? (r.requires_interpreter ? "yes" : ""),
    language_requirement: s(r.language_requirement),
    adjustments_needed: s(r.adjustments_needed),
  };
}

const inputClass =
  "mt-1 w-full rounded-lg border border-(--color-border) bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--color-accent)";
const labelClass = "block text-sm font-medium text-gray-700";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-(--color-border) pt-5 first:border-0 first:pt-0">
      <h4 className="font-heading text-lg font-bold text-(--color-primary)">{title}</h4>
      {children}
    </section>
  );
}

function ReadValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 min-h-[2.5rem] w-full whitespace-pre-wrap rounded-lg border border-(--color-border) bg-(--color-bg-sage) px-4 py-2 text-sm text-gray-900">
      {children || <span className="text-gray-400">Not provided</span>}
    </div>
  );
}

interface FormCtxValue {
  draft: Draft;
  editing: boolean;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
}
const FormCtx = createContext<FormCtxValue | null>(null);
const useForm = () => {
  const ctx = useContext(FormCtx);
  if (!ctx) throw new Error("Referral fields must be rendered inside ReferralModal");
  return ctx;
};

/** A text/date/tel/email input in edit mode, a read-only box otherwise. */
function Text({
  k,
  title,
  type = "text",
  required,
  area,
  maxLength,
}: {
  k: keyof Draft & string;
  title: string;
  type?: string;
  required?: boolean;
  area?: boolean;
  maxLength?: number;
}) {
  const { draft, editing, set } = useForm();
  const value = draft[k] as string;
  return (
    <div>
      <label className={labelClass}>
        {title}
        {required && editing ? " *" : ""}
      </label>
      {editing ? (
        area ? (
          <textarea
            rows={2}
            maxLength={maxLength}
            className={inputClass}
            value={value}
            onChange={(e) => set(k, e.target.value as never)}
          />
        ) : (
          <input
            type={type}
            required={required}
            maxLength={maxLength}
            className={inputClass}
            value={value}
            onChange={(e) => set(k, e.target.value as never)}
          />
        )
      ) : (
        <ReadValue>{type === "date" && value ? new Date(value).toLocaleDateString() : value}</ReadValue>
      )}
    </div>
  );
}

/** Radio buttons in edit mode, a read-only box otherwise. */
function Choice({ k, title, options }: { k: keyof Draft & string; title: string; options: Opt[] }) {
  const { draft, editing, set } = useForm();
  const value = draft[k] as string;
  return (
    <div>
      <label className={labelClass}>{title}</label>
      {editing ? (
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm text-gray-900">
              <input
                type="radio"
                name={k}
                checked={value === o.value}
                onChange={() => set(k, o.value as never)}
                className="h-4 w-4"
              />
              {o.label}
            </label>
          ))}
          {value && (
            <button
              type="button"
              onClick={() => set(k, "" as never)}
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      ) : (
        <ReadValue>{options.find((o) => o.value === value)?.label ?? value}</ReadValue>
      )}
    </div>
  );
}

export default function ReferralModal({
  referral,
  initialMode = "view",
  onClose,
  onSave,
}: {
  referral: ReferralDetails;
  initialMode?: "view" | "edit";
  onClose: () => void;
  /** Resolves when saved; should throw on failure (the caller shows the error). */
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
}) {
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [draft, setDraft] = useState<Draft>(() => toDraft(referral));
  const [saving, setSaving] = useState(false);
  const editing = mode === "edit";

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const wantsAntenatal = draft.referral_type === "birth_confidence" || draft.referral_type === "both";
  const wantsFeeding = draft.referral_type === "breastfeeding_clinic" || draft.referral_type === "both";

  const toggleBarrier = (value: string) =>
    set(
      "barriers",
      draft.barriers.includes(value)
        ? draft.barriers.filter((b) => b !== value)
        : [...draft.barriers, value]
    );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.barriers.includes("other") && !draft.barriers_other.trim()) {
      // Mirrors the backend rule on the original form.
      toast.error("Please specify the other barrier, or untick “Other”.");
      return;
    }

    const nullIfBlank = (v: string) => (v.trim() === "" ? null : v.trim());
    const payload: Record<string, unknown> = {
      referrer_name: nullIfBlank(draft.referrer_name),
      referrer_email: nullIfBlank(draft.referrer_email),
      referrer_phone: nullIfBlank(draft.referrer_phone),
      mother_name: draft.mother_name.trim(),
      preferred_name: nullIfBlank(draft.preferred_name),
      mother_phone: nullIfBlank(draft.mother_phone),
      mother_email: nullIfBlank(draft.mother_email),
      safe_contact_method: nullIfBlank(draft.safe_contact_method),
      voicemail_ok: nullIfBlank(draft.voicemail_ok),
      communication_restrictions: nullIfBlank(draft.communication_restrictions),
      locality: nullIfBlank(draft.locality),
      postcode_area: nullIfBlank(draft.postcode_area),
      referral_type: draft.referral_type,
      barriers: draft.barriers,
      barriers_other: draft.barriers.includes("other") ? nullIfBlank(draft.barriers_other) : null,
      additional_notes: nullIfBlank(draft.additional_notes),
      interpreter_support: nullIfBlank(draft.interpreter_support),
      language_requirement: nullIfBlank(draft.language_requirement),
      adjustments_needed: nullIfBlank(draft.adjustments_needed),
      // Answers that only apply to a service that is no longer selected are cleared.
      estimated_due_date: wantsAntenatal ? nullIfBlank(draft.estimated_due_date) : null,
      gestation_info: wantsAntenatal ? nullIfBlank(draft.gestation_info) : null,
      can_attend_course: wantsAntenatal ? nullIfBlank(draft.can_attend_course) : null,
      timing_notes: wantsAntenatal ? nullIfBlank(draft.timing_notes) : null,
      baby_born: wantsFeeding ? nullIfBlank(draft.baby_born) : null,
      baby_age_or_due: wantsFeeding ? nullIfBlank(draft.baby_age_or_due) : null,
      preferred_appointment_timing: wantsFeeding ? nullIfBlank(draft.preferred_appointment_timing) : null,
    };

    setSaving(true);
    try {
      await onSave(referral.id, payload);
      onClose();
    } catch {
      // The caller already showed an error toast; stay open so nothing is lost.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={saving ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit referral" : "Referral details"}
    >
      <FormCtx.Provider value={{ draft, editing, set }}>
      <form
        onSubmit={handleSave}
        className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 rounded-t-2xl bg-(--color-primary) px-6 py-4 text-white">
          <div>
            <h3 className="font-heading text-xl font-bold">
              {editing ? "Edit referral" : "Referral details"}
            </h3>
            <p className="mt-1 text-sm text-white/80">
              Reference:{" "}
              <span className="font-mono">{referral.reference_number || "Not available"}</span>
              {" · "}Status: <span className="capitalize">{referral.status}</span>
              {" · "}Submitted {new Date(referral.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!editing && (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm hover:bg-white/25"
              >
                <Pencil size={14} /> Edit
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close" className="text-white/80 hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <Section title="1. Your organisation">
            <div>
              <label className={labelClass}>Approved referral organisation</label>
              <ReadValue>{referral.partner_name}</ReadValue>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Text k="referrer_name" title="Referrer's full name" />
              <Text k="referrer_email" title="Work email address" type="email" />
              <Text k="referrer_phone" title="Work telephone number" type="tel" />
            </div>
          </Section>

          <Section title="2. Person being referred">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text k="mother_name" title="Full name" required />
              <Text k="preferred_name" title="Preferred name" />
              <Text k="mother_phone" title="Telephone" type="tel" />
              <Text k="mother_email" title="Email" type="email" />
            </div>
            <Choice k="safe_contact_method" title="Safe way to contact this person" options={CONTACT_OPTS} />
            <Choice k="voicemail_ok" title="May we leave a voicemail or message?" options={YES_NO_NOT_SURE} />
            <Text
              k="communication_restrictions"
              title="Any communication restrictions we should know about?"
              maxLength={500}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text k="locality" title="Town or locality in Norfolk" />
              <Text k="postcode_area" title="Postcode or postcode area" maxLength={20} />
            </div>
          </Section>

          <Section title="3. Support requested">
            <Choice k="referral_type" title="Which service are you referring for?" options={SERVICES} />
            {wantsAntenatal && (
              <div className="space-y-4 rounded-xl bg-(--color-bg-sage)/60 p-4">
                <p className="text-sm font-semibold text-(--color-primary)">Antenatal education</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text k="estimated_due_date" title="Estimated due date" type="date" />
                  <Text k="gestation_info" title="Approximate gestation" maxLength={100} />
                </div>
                <Choice k="can_attend_course" title="Ability to attend a six-week course" options={YES_NO_UNSURE} />
                <Text k="timing_notes" title="Any practical timing considerations" maxLength={500} />
              </div>
            )}
            {wantsFeeding && (
              <div className="space-y-4 rounded-xl bg-(--color-bg-sage)/60 p-4">
                <p className="text-sm font-semibold text-(--color-primary)">Infant-feeding support</p>
                <Choice k="baby_born" title="Has the baby been born?" options={YES_NO_NOT_KNOWN} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Text k="baby_age_or_due" title="Baby's approximate age or expected due date" maxLength={100} />
                  <Text k="preferred_appointment_timing" title="Preferred timing for an appointment" maxLength={255} />
                </div>
              </div>
            )}
          </Section>

          <Section title="4. Barriers to accessing support">
            <div>
              <label className={labelClass}>
                What may make it difficult for this family to access suitable support?
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {BARRIER_OPTIONS.map((b) => (
                  <label key={b.value} className="flex items-center gap-2 text-sm text-gray-900">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded"
                      checked={draft.barriers.includes(b.value)}
                      disabled={!editing}
                      onChange={() => toggleBarrier(b.value)}
                    />
                    {b.label}
                  </label>
                ))}
              </div>
              {draft.barriers.includes("other") && (
                <Text k="barriers_other" title="Other barrier" maxLength={255} />
              )}
            </div>
            <Text
              k="additional_notes"
              title="Anything else we should know about access barriers?"
              area
              maxLength={1000}
            />
          </Section>

          <Section title="5. Access and communication needs">
            <Choice
              k="interpreter_support"
              title="Would language interpretation or communication support be helpful?"
              options={YES_NO_NOT_SURE}
            />
            <Text k="language_requirement" title="Language" maxLength={255} />
            <Text
              k="adjustments_needed"
              title="Any mobility, venue-access or other practical adjustments?"
              area
              maxLength={500}
            />
          </Section>

          <Section title="6. Referral declaration">
            <label className="flex items-start gap-3 text-sm text-gray-900">
              <input
                type="checkbox"
                checked={!!referral.consent_obtained}
                readOnly
                disabled
                className="mt-1 h-4 w-4 shrink-0 rounded"
              />
              <span>
                The referrer confirmed they explained the purpose of this referral, the information
                shared and how GNI may contact the person; that the person knows about the referral
                and agreed to contact by the safe method above; and that the information is accurate
                and not unnecessarily sensitive. (Recorded at submission; cannot be edited.)
              </span>
            </label>
          </Section>

          <Section title="Allocation">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Cohort</label>
                <ReadValue>
                  {[referral.cohort_name, referral.clinic_cohort_name].filter(Boolean).join(" · ")}
                </ReadValue>
              </div>
              <div>
                <label className={labelClass}>Venue</label>
                <ReadValue>{referral.venue_name}</ReadValue>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Status and cohort are changed with the Assign button, not here.
            </p>
          </Section>

          <div className="flex flex-col gap-2 border-t border-(--color-border) pt-4 sm:flex-row sm:justify-end">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setDraft(toDraft(referral));
                    if (initialMode === "edit") onClose();
                    else setMode("view");
                  }}
                  className="rounded-lg border border-(--color-border) px-5 py-2 text-sm font-medium text-gray-700 hover:bg-(--color-bg-sage) disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-5 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-(--color-border) px-5 py-2 text-sm font-medium text-(--color-primary) hover:bg-(--color-bg-sage)"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </form>
      </FormCtx.Provider>
    </div>
  );
}

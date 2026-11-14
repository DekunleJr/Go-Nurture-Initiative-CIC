"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { CheckCircle2, Loader2, LogOut, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { PortalNavbar } from "@/components/portal/PortalNavbar";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface PartnerData {
  contact_name: string;
  organisation_name: string;
  is_admin?: boolean;
}

const BARRIERS = [
  { value: "affordability", label: "Affordability" },
  { value: "language", label: "Language or communication" },
  { value: "migration", label: "Migration or displacement-related access" },
  { value: "isolation", label: "Isolation" },
  { value: "service_access", label: "Difficulty accessing services" },
  { value: "disability", label: "Disability or accessibility needs" },
  { value: "housing", label: "Housing instability" },
  { value: "other", label: "Other (please specify)" },
] as const;

const initialForm = {
  referrer_name: "",
  referrer_email: "",
  referrer_phone: "",
  mother_name: "",
  preferred_name: "",
  mother_phone: "",
  mother_email: "",
  safe_contact_method: "",
  voicemail_ok: "",
  communication_restrictions: "",
  locality: "",
  postcode_area: "",
  referral_type: "",
  estimated_due_date: "",
  gestation_info: "",
  can_attend_course: "",
  timing_notes: "",
  baby_born: "",
  baby_age_or_due: "",
  preferred_appointment_timing: "",
  barriers: [] as string[],
  barriers_other: "",
  additional_notes: "",
  interpreter_support: "",
  adjustments_needed: "",
  consent_obtained: false,
};

type FormState = typeof initialForm;

const inputClass = "mt-1 w-full rounded-lg border border-(--color-border) px-4 py-2";
const labelClass = "block text-sm font-medium text-foreground";

/** Turn a FastAPI error body (string or validation list) into one readable line. */
function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: unknown } | undefined)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      return (first.msg ?? "Please check the form and try again.").replace(/^Value error, /, "");
    }
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
  required,
}: {
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="radio"
            name={name}
            value={o.value}
            required={required}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="h-4 w-4"
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 border-t border-(--color-border) pt-6 first:border-0 first:pt-0">
      <legend className="font-heading text-lg font-bold text-(--color-primary)">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function ReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const partner = useLocalStorage<PartnerData>("partner");
  const [form, setForm] = useState<FormState>(initialForm);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const wantsAntenatal = form.referral_type === "birth_confidence" || form.referral_type === "both";
  const wantsFeeding = form.referral_type === "breastfeeding_clinic" || form.referral_type === "both";

  const toggleBarrier = (value: string) =>
    set(
      "barriers",
      form.barriers.includes(value) ? form.barriers.filter((b) => b !== value) : [...form.barriers, value]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authClient.isLoggedIn()) {
      toast.error("You must be logged in to submit a referral.");
      return;
    }
    if (form.barriers.length === 0) {
      toast.error("Please select at least one barrier to accessing support.");
      return;
    }

    setLoading(true);
    // Send blanks as null so optional fields are genuinely optional.
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      payload[key] = value === "" ? null : value;
    }
    // Only send the answers for the service(s) actually requested.
    if (!wantsAntenatal) {
      payload.estimated_due_date = null;
      payload.gestation_info = null;
      payload.can_attend_course = null;
      payload.timing_notes = null;
    }
    if (!wantsFeeding) {
      payload.baby_born = null;
      payload.baby_age_or_due = null;
      payload.preferred_appointment_timing = null;
    }
    if (!form.barriers.includes("other")) payload.barriers_other = null;

    try {
      const res = await api.post<{ reference_number: string | null }>("/api/referrals/", payload);
      setReference(res.reference_number ?? "Not available");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    api.post("/api/auth/logout").finally(() => {
      authClient.clear();
      router.push("/portal/login");
    });
  };

  const navActions = (
    <>
      {partner?.is_admin && (
        <Link
          href="/admin/dashboard"
          aria-label="Admin"
          className="inline-flex items-center gap-2 rounded-lg bg-(--color-accent) px-3 py-2 text-sm font-medium text-white transition hover:bg-(--color-accent-dark) sm:px-4"
        >
          <Shield size={16} />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      )}
      <button
        onClick={handleLogout}
        aria-label="Sign out"
        className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-white px-3 py-2 text-sm font-medium text-(--color-primary) sm:px-4 transition hover:bg-(--color-bg-sage)"
      >
        <LogOut size={16} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-(--color-bg-cream)">
      <PortalNavbar
        title="Submit a Referral"
        subtitle="Go Nurture Initiative · Approved referral partners"
        actions={navActions}
      />

      <header className="relative overflow-hidden bg-(--color-primary) bg-gradient-to-br from-(--color-primary) via-(--color-primary-dark) to-(--color-accent) text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-widest text-white/70">Online referral form</p>
          <h2 className="mt-2 font-heading text-3xl font-bold sm:text-4xl">Submit a referral</h2>
          <p className="mt-3 max-w-2xl text-sm text-white/80 sm:text-base">
            For approved Go Nurture Initiative referral partners only. Refer an eligible woman or
            family for our free antenatal education, infant-feeding support, or both. A referral does
            not guarantee a place; our team will review each submission and contact the family using
            the safe contact method provided.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/80">
            This is not an emergency or urgent maternity referral service. If someone is in immediate
            danger, call 999. For urgent pregnancy or maternity concerns, contact their local
            maternity team.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {reference ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-(--color-border) sm:p-8">
            <div className="flex items-center gap-3 text-(--color-primary)">
              <CheckCircle2 size={28} />
              <h3 className="font-heading text-2xl font-bold">Referral received</h3>
            </div>
            <p className="mt-4 text-foreground">
              Thank you. Your referral has been received. A member of the GNI team will review it.
              This is not confirmation of a programme place or appointment. Please retain your
              reference number for follow-up.
            </p>
            <p className="mt-4 rounded-xl bg-(--color-bg-sage) p-4 text-lg">
              Referral reference: <strong className="font-mono">{reference}</strong>
            </p>
            <p className="mt-4 text-sm text-(--color-text-muted)">
              Please do not submit confidential clinical notes, diagnoses, immigration documents or
              safeguarding disclosures in this form. If there is an immediate emergency, call 999. If
              urgent maternity care is needed, contact the person&rsquo;s local maternity team.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setReference(null);
                  setForm({ ...initialForm });
                }}
                className="rounded-lg bg-(--color-primary) px-5 py-2.5 font-semibold text-white hover:opacity-95"
              >
                Submit another referral
              </button>
              <Link
                href="/portal/dashboard"
                className="rounded-lg border border-(--color-border) px-5 py-2.5 font-semibold text-(--color-primary) hover:bg-(--color-bg-sage)"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-(--color-border) sm:p-8"
          >
            <Section title="1. Your organisation">
              <div>
                <label className={labelClass}>Approved referral organisation *</label>
                <input
                  type="text"
                  readOnly
                  className={`${inputClass} bg-(--color-bg-sage)`}
                  value={partner?.organisation_name ?? ""}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Referrer&rsquo;s full name *</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={form.referrer_name}
                    onChange={(e) => set("referrer_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Work email address *</label>
                  <input
                    type="email"
                    required
                    className={inputClass}
                    value={form.referrer_email}
                    onChange={(e) => set("referrer_email", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Work telephone number *</label>
                  <input
                    type="tel"
                    required
                    className={inputClass}
                    value={form.referrer_phone}
                    onChange={(e) => set("referrer_phone", e.target.value)}
                  />
                </div>
              </div>
            </Section>

            <Section title="2. Person being referred">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Full name *</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={form.mother_name}
                    onChange={(e) => set("mother_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Preferred name</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={form.preferred_name}
                    onChange={(e) => set("preferred_name", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Telephone</label>
                  <input
                    type="tel"
                    className={inputClass}
                    value={form.mother_phone}
                    onChange={(e) => set("mother_phone", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={form.mother_email}
                    onChange={(e) => set("mother_email", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Safe way to contact this person *</label>
                <RadioGroup
                  name="safe_contact_method"
                  required
                  value={form.safe_contact_method}
                  onChange={(v) => set("safe_contact_method", v)}
                  options={[
                    { value: "telephone", label: "Telephone" },
                    { value: "email", label: "Email" },
                    { value: "either", label: "Either" },
                  ]}
                />
                <p className="mt-1 text-xs text-(--color-text-muted)">
                  Make sure the matching telephone number or email address is filled in above.
                </p>
              </div>
              <div>
                <label className={labelClass}>May we leave a voicemail or message? *</label>
                <RadioGroup
                  name="voicemail_ok"
                  required
                  value={form.voicemail_ok}
                  onChange={(v) => set("voicemail_ok", v)}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                />
              </div>
              <div>
                <label className={labelClass}>Any communication restrictions we should know about?</label>
                <input
                  type="text"
                  maxLength={500}
                  className={inputClass}
                  value={form.communication_restrictions}
                  onChange={(e) => set("communication_restrictions", e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Town or locality in Norfolk *</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={form.locality}
                    onChange={(e) => set("locality", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Postcode or postcode area</label>
                  <input
                    type="text"
                    maxLength={20}
                    className={inputClass}
                    value={form.postcode_area}
                    onChange={(e) => set("postcode_area", e.target.value)}
                  />
                </div>
              </div>
            </Section>

            <Section title="3. Support requested">
              <div>
                <label className={labelClass}>Which service are you referring for? *</label>
                <RadioGroup
                  name="referral_type"
                  required
                  value={form.referral_type}
                  onChange={(v) => set("referral_type", v)}
                  options={[
                    { value: "birth_confidence", label: "Antenatal education" },
                    { value: "breastfeeding_clinic", label: "Infant-feeding clinic" },
                    { value: "both", label: "Both" },
                  ]}
                />
              </div>

              {wantsAntenatal && (
                <div className="space-y-5 rounded-xl bg-(--color-bg-sage) p-4">
                  <p className="text-sm font-semibold text-(--color-primary)">Antenatal education</p>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Estimated due date</label>
                      <input
                        type="date"
                        className={inputClass}
                        value={form.estimated_due_date}
                        onChange={(e) => set("estimated_due_date", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Or approximate gestation *</label>
                      <input
                        type="text"
                        required={!form.estimated_due_date}
                        maxLength={100}
                        placeholder="e.g. about 24 weeks, or Not known"
                        className={inputClass}
                        value={form.gestation_info}
                        onChange={(e) => set("gestation_info", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Ability to attend a six-week course</label>
                    <RadioGroup
                      name="can_attend_course"
                      value={form.can_attend_course}
                      onChange={(v) => set("can_attend_course", v)}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                        { value: "unsure", label: "Unsure" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Any practical timing considerations</label>
                    <input
                      type="text"
                      maxLength={500}
                      className={inputClass}
                      value={form.timing_notes}
                      onChange={(e) => set("timing_notes", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {wantsFeeding && (
                <div className="space-y-5 rounded-xl bg-(--color-bg-sage) p-4">
                  <p className="text-sm font-semibold text-(--color-primary)">Infant-feeding support</p>
                  <div>
                    <label className={labelClass}>Has the baby been born? *</label>
                    <RadioGroup
                      name="baby_born"
                      required
                      value={form.baby_born}
                      onChange={(v) => set("baby_born", v)}
                      options={[
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                        { value: "not_known", label: "Not known" },
                      ]}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Baby&rsquo;s approximate age or expected due date</label>
                    <input
                      type="text"
                      maxLength={100}
                      className={inputClass}
                      value={form.baby_age_or_due}
                      onChange={(e) => set("baby_age_or_due", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Preferred timing for an appointment</label>
                    <input
                      type="text"
                      maxLength={255}
                      className={inputClass}
                      value={form.preferred_appointment_timing}
                      onChange={(e) => set("preferred_appointment_timing", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </Section>

            <Section title="4. Barriers to accessing support">
              <div>
                <label className={labelClass}>
                  What may make it difficult for this family to access suitable support? * (tick all
                  that apply)
                </label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {BARRIERS.map((b) => (
                    <label key={b.value} className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={form.barriers.includes(b.value)}
                        onChange={() => toggleBarrier(b.value)}
                      />
                      {b.label}
                    </label>
                  ))}
                </div>
                {form.barriers.includes("other") && (
                  <input
                    type="text"
                    required
                    maxLength={255}
                    placeholder="Please specify"
                    className={inputClass}
                    value={form.barriers_other}
                    onChange={(e) => set("barriers_other", e.target.value)}
                  />
                )}
              </div>
              <div>
                <label className={labelClass}>Anything else we should know about access barriers?</label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  className={inputClass}
                  value={form.additional_notes}
                  onChange={(e) => set("additional_notes", e.target.value)}
                />
                <p className="mt-1 text-xs text-(--color-text-muted)">
                  Optional, brief. Do not include medical records, immigration documents or
                  safeguarding narratives.
                </p>
              </div>
            </Section>

            <Section title="5. Access and communication needs">
              <div>
                <label className={labelClass}>Would language interpretation or communication support be helpful?</label>
                <RadioGroup
                  name="interpreter_support"
                  value={form.interpreter_support}
                  onChange={(v) => set("interpreter_support", v)}
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No" },
                    { value: "not_sure", label: "Not sure" },
                  ]}
                />
              </div>
              <div>
                <label className={labelClass}>Any mobility, venue-access or other practical adjustments?</label>
                <textarea
                  rows={2}
                  maxLength={500}
                  className={inputClass}
                  value={form.adjustments_needed}
                  onChange={(e) => set("adjustments_needed", e.target.value)}
                />
                <p className="mt-1 text-xs text-(--color-text-muted)">Optional, brief.</p>
              </div>
            </Section>

            <Section title="6. Referral declaration">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 shrink-0 rounded"
                  checked={form.consent_obtained}
                  onChange={(e) => set("consent_obtained", e.target.checked)}
                />
                <span className="text-sm text-foreground">
                  I confirm that I have explained the purpose of this referral, the information I am
                  sharing and how Go Nurture Initiative may contact the person. The person knows about
                  the referral and has agreed to contact by the safe method entered above. I have
                  provided accurate information to the best of my knowledge and have not included
                  unnecessary sensitive information. *
                </span>
              </label>
            </Section>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-(--color-accent) bg-gradient-to-br from-(--color-primary) to-(--color-accent) px-6 py-3 text-white shadow-sm transition hover:opacity-95 disabled:opacity-50"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Submit Referral
              </button>
              <Link
                href="/privacy"
                target="_blank"
                className="text-sm text-(--color-accent) hover:underline"
              >
                Read our Privacy Notice
              </Link>
              <Link
                href="/portal/dashboard"
                className="rounded-lg border border-(--color-border) px-6 py-3 text-center hover:bg-(--color-bg-sage)"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

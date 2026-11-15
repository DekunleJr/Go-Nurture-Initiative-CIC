import { z } from "zod";

const email = z.email();
const optStr = (max: number) => z.string().max(max).nullish();
const yesNoNotSure = z.enum(["yes", "no", "not_sure"]);
const yesNoUnsure = z.enum(["yes", "no", "unsure"]);
const yesNoNotKnown = z.enum(["yes", "no", "not_known"]);
const safeContact = z.enum(["telephone", "email", "either"]);
const referralType = z.enum(["birth_confidence", "breastfeeding_clinic", "both"]);
const barrier = z.enum([
  "affordability",
  "language",
  "migration",
  "isolation",
  "service_access",
  "disability",
  "housing",
  "other",
]);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Must be a date (YYYY-MM-DD)").transform((s) => s.slice(0, 10));

// ---------------------------------------------------------------- auth
export const loginSchema = z.object({ email, password: z.string().min(1).max(256) });
export const setPasswordSchema = z.object({ token: z.string(), password: z.string().min(8).max(256) });
export const forgotPasswordSchema = z.object({ email });
export const partnerCreateSchema = z.object({
  organisation_name: z.string(),
  contact_name: z.string(),
  email,
  phone: z.string().nullish(),
  organisation_type: z.string().default("community"),
});
export const facilitatorCreateSchema = z.object({ name: z.string(), email, phone: z.string().nullish() });

// ----------------------------------------------------------- referrals
const referralFields = {
  referrer_name: z.string().min(1).max(255),
  referrer_email: email,
  referrer_phone: z.string().min(1).max(50),
  mother_name: z.string().min(1).max(255),
  preferred_name: optStr(255),
  mother_phone: optStr(50),
  mother_email: email.nullish(),
  safe_contact_method: safeContact,
  voicemail_ok: yesNoNotSure,
  communication_restrictions: optStr(500),
  locality: z.string().min(1).max(255),
  postcode_area: optStr(20),
  referral_type: referralType.default("birth_confidence"),
  estimated_due_date: isoDate.nullish(),
  gestation_info: optStr(100),
  can_attend_course: yesNoUnsure.nullish(),
  timing_notes: optStr(500),
  baby_born: yesNoNotKnown.nullish(),
  baby_age_or_due: optStr(100),
  preferred_appointment_timing: optStr(255),
  barriers: z.array(barrier).min(1),
  barriers_other: optStr(255),
  additional_notes: optStr(1000),
  interpreter_support: yesNoNotSure.nullish(),
  language_requirement: optStr(255),
  adjustments_needed: optStr(500),
};

export const referralCreateSchema = z
  .object({ ...referralFields, consent_obtained: z.boolean().default(false) })
  .superRefine((v, ctx) => {
    const add = (message: string) => ctx.addIssue({ code: "custom", message });
    if (v.safe_contact_method === "telephone" && !v.mother_phone)
      add("A telephone number is required when telephone is the safe contact method");
    if (v.safe_contact_method === "email" && !v.mother_email)
      add("An email address is required when email is the safe contact method");
    if (v.safe_contact_method === "either" && !(v.mother_phone || v.mother_email))
      add("Provide a telephone number or email address for the safe contact method");
    if (v.barriers.includes("other") && !v.barriers_other?.trim()) add("Please specify the other barrier");
  });

export const referralUpdateSchema = z
  .object({
    ...Object.fromEntries(Object.entries(referralFields).map(([k, s]) => [k, (s as z.ZodType).nullish()])),
    mother_name: z.string().min(1).max(255).nullish(),
    // No defaults here: an absent key must stay absent so it is not overwritten.
    referral_type: referralType.nullish(),
    requires_interpreter: z.boolean().nullish(),
  })
  .partial();

export const referralStatusSchema = z.object({ status: z.string(), cohort_id: z.uuid().nullish() });

// ------------------------------------------------------------- others
export const contactSchema = z.object({
  name: z.string(),
  email,
  subject: z.string().nullish(),
  message: z.string(),
});

export const donationCreateSchema = z.object({
  amount: z.number(),
  currency: z.string().default("GBP"),
  donor_name: z.string().nullish(),
  donor_email: z.string().nullish(),
  message: z.string().nullish(),
  is_anonymous: z.boolean().default(false),
});

export const sessionReviewSchema = z.object({
  cohort_id: z.uuid(),
  session_date: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "Invalid date"),
  week_number: z.number().int().nullish(),
  mode: z.string().nullish(),
  venue_or_platform: z.string().nullish(),
  lead_facilitator: z.string().nullish(),
  co_facilitator: z.string().nullish(),
  start_time: z.string().nullish(),
  finish_time: z.string().nullish(),
  registered_count: z.number().int().nullish(),
  attended_count: z.number().int().nullish(),
  supporter_count: z.number().int().nullish(),
  reasonable_adjustments: z.string().nullish(),
  fidelity_checked: z.array(z.string()).nullish(),
  quality_ratings: z.record(z.string(), z.unknown()).nullish(),
  deviations: z.string().nullish(),
  incidents: z.array(z.record(z.string(), z.unknown())).nullish(),
  reflection: z.record(z.string(), z.unknown()).nullish(),
  status: z.string().default("submitted"),
});

// --------------------------------------------------------------- admin
export const partnerUpdateSchema = z
  .object({
    organisation_name: z.string().min(1).max(255),
    contact_name: z.string().min(1).max(255),
    phone: z.string().max(50).nullable(),
    organisation_type: z.string().min(1).max(100),
    is_admin: z.boolean(),
  })
  .partial();

export const venueCreateSchema = z.object({
  name: z.string().min(1).max(255),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  postcode: z.string().max(20).nullish(),
  capacity: z.number().int().min(0).nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  description: z.string().nullish(),
  transport_links: z.string().nullish(),
  nearby_landmarks: z.string().nullish(),
  accessibility_info: z.string().nullish(),
});
export const venueUpdateSchema = venueCreateSchema.partial().extend({ is_active: z.boolean().optional() });

export const cohortCreateSchema = z.object({
  name: z.string().min(1).max(255),
  year: z.number().int().min(2000).max(2200),
  cohort_type: z.string().min(1).max(100),
  start_date: isoDate,
  end_date: isoDate.nullish(),
  max_participants: z.number().int().min(1).max(10000).default(30),
  venue_id: z.uuid().nullish(),
  is_active: z.boolean().nullish().default(true),
  description: z.string().nullish(),
});
export const cohortUpdateSchema = z
  .object({
    name: z.string().min(1).max(255),
    year: z.number().int().min(2000).max(2200),
    cohort_type: z.string().min(1).max(100),
    start_date: isoDate,
    end_date: isoDate.nullable(),
    max_participants: z.number().int().min(1).max(10000),
    venue_id: z.uuid().nullable(),
    is_active: z.boolean(),
    description: z.string().nullable(),
  })
  .partial();

export const facilitatorAssignSchema = z.object({ facilitator_id: z.uuid() });
export const communityPartnerCreateSchema = z.object({ name: z.string().min(1).max(255) });
export const communityPartnerUpdateSchema = z
  .object({ name: z.string().min(1).max(255), is_active: z.boolean() })
  .partial();

export const emailTemplateUpdateSchema = z.object({
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(100000),
});
export const emailPreviewSchema = z.object({ variables: z.record(z.string(), z.unknown()).default({}) });
export const emailTestSendSchema = emailPreviewSchema.extend({ recipient_email: email });

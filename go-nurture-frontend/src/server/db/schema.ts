import {
  boolean,
  date,
  datetime,
  double,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const id = () =>
  varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const createdAt = () =>
  datetime("created_at", { mode: "date", fsp: 3 }).$defaultFn(() => new Date());
const updatedAt = () =>
  datetime("updated_at", { mode: "date", fsp: 3 })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date());

export const partnerOrganisations = mysqlTable("partner_organisations", {
  id: id(),
  organisationName: varchar("organisation_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  organisationType: varchar("organisation_type", { length: 100 }).notNull().default("community"),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  setPasswordToken: varchar("set_password_token", { length: 255 }).unique(),
  setPasswordTokenExpires: datetime("set_password_token_expires", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const facilitators = mysqlTable("facilitators", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  hashedPassword: varchar("hashed_password", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  setPasswordToken: varchar("set_password_token", { length: 255 }).unique(),
  setPasswordTokenExpires: datetime("set_password_token_expires", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const venues = mysqlTable("venues", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  postcode: varchar("postcode", { length: 20 }),
  capacity: int("capacity"),
  latitude: double("latitude"),
  longitude: double("longitude"),
  description: text("description"),
  transportLinks: text("transport_links"),
  nearbyLandmarks: text("nearby_landmarks"),
  accessibilityInfo: text("accessibility_info"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
});

export const cohorts = mysqlTable("cohorts", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  year: int("year").notNull(),
  cohortType: varchar("cohort_type", { length: 100 }).notNull().default("birth_confidence"),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }),
  maxParticipants: int("max_participants").default(30),
  isActive: boolean("is_active").notNull().default(true),
  description: text("description"),
  venueId: varchar("venue_id", { length: 36 }).references(() => venues.id),
  facilitatorId: varchar("facilitator_id", { length: 36 }).references(() => facilitators.id),
  createdAt: createdAt(),
});

export const referrals = mysqlTable(
  "referrals",
  {
    id: id(),
    partnerId: varchar("partner_id", { length: 36 })
      .notNull()
      .references(() => partnerOrganisations.id),
    motherName: varchar("mother_name", { length: 255 }).notNull(),
    motherPhone: varchar("mother_phone", { length: 50 }),
    motherEmail: varchar("mother_email", { length: 255 }),
    estimatedDueDate: date("estimated_due_date", { mode: "string" }),
    referenceNumber: varchar("reference_number", { length: 32 }).unique(),
    referrerName: varchar("referrer_name", { length: 255 }),
    referrerEmail: varchar("referrer_email", { length: 255 }),
    referrerPhone: varchar("referrer_phone", { length: 50 }),
    preferredName: varchar("preferred_name", { length: 255 }),
    safeContactMethod: varchar("safe_contact_method", { length: 20 }),
    voicemailOk: varchar("voicemail_ok", { length: 20 }),
    communicationRestrictions: text("communication_restrictions"),
    locality: varchar("locality", { length: 255 }),
    postcodeArea: varchar("postcode_area", { length: 20 }),
    gestationInfo: varchar("gestation_info", { length: 100 }),
    canAttendCourse: varchar("can_attend_course", { length: 20 }),
    timingNotes: text("timing_notes"),
    babyBorn: varchar("baby_born", { length: 20 }),
    babyAgeOrDue: varchar("baby_age_or_due", { length: 100 }),
    preferredAppointmentTiming: varchar("preferred_appointment_timing", { length: 255 }),
    barriers: json("barriers").$type<string[]>(),
    barriersOther: varchar("barriers_other", { length: 255 }),
    interpreterSupport: varchar("interpreter_support", { length: 20 }),
    adjustmentsNeeded: text("adjustments_needed"),
    referralType: varchar("referral_type", { length: 100 }).notNull().default("birth_confidence"),
    languageRequirement: varchar("language_requirement", { length: 255 }),
    additionalNotes: text("additional_notes"),
    requiresInterpreter: boolean("requires_interpreter").notNull().default(false),
    consentObtained: boolean("consent_obtained").notNull().default(false),
    cohortId: varchar("cohort_id", { length: 36 }).references(() => cohorts.id),
    clinicCohortId: varchar("clinic_cohort_id", { length: 36 }).references(() => cohorts.id),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("ix_referrals_partner").on(t.partnerId), index("ix_referrals_status").on(t.status)],
);

export const sessionReviews = mysqlTable("session_reviews", {
  id: id(),
  cohortId: varchar("cohort_id", { length: 36 })
    .notNull()
    .references(() => cohorts.id),
  facilitatorId: varchar("facilitator_id", { length: 36 })
    .notNull()
    .references(() => facilitators.id),
  sessionDate: datetime("session_date", { mode: "date", fsp: 3 }).notNull(),
  weekNumber: int("week_number"),
  mode: varchar("mode", { length: 50 }),
  venueOrPlatform: varchar("venue_or_platform", { length: 255 }),
  leadFacilitator: varchar("lead_facilitator", { length: 255 }),
  coFacilitator: varchar("co_facilitator", { length: 255 }),
  startTime: varchar("start_time", { length: 50 }),
  finishTime: varchar("finish_time", { length: 50 }),
  registeredCount: int("registered_count"),
  attendedCount: int("attended_count"),
  supporterCount: int("supporter_count"),
  reasonableAdjustments: text("reasonable_adjustments"),
  fidelityChecked: json("fidelity_checked").$type<string[]>(),
  qualityRatings: json("quality_ratings").$type<Record<string, unknown>>(),
  deviations: text("deviations"),
  incidents: json("incidents").$type<Record<string, unknown>[]>(),
  reflection: json("reflection").$type<Record<string, unknown>>(),
  status: varchar("status", { length: 20 }).notNull().default("draft"),
  submittedAt: datetime("submitted_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const contactSubmissions = mysqlTable("contact_submissions", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: createdAt(),
});

export const donations = mysqlTable("donations", {
  id: id(),
  amount: double("amount").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("GBP"),
  donorName: varchar("donor_name", { length: 255 }),
  donorEmail: varchar("donor_email", { length: 255 }),
  paymentProvider: varchar("payment_provider", { length: 50 }).notNull().default("stripe"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }).unique(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
    .notNull()
    .default("pending"),
  message: text("message"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: createdAt(),
});

export const emailLogs = mysqlTable("email_logs", {
  id: id(),
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body"),
  emailType: varchar("email_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  errorMessage: text("error_message"),
  createdAt: createdAt(),
});

export const communityPartners = mysqlTable("community_partners", {
  id: id(),
  name: varchar("name", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const emailTemplates = mysqlTable(
  "email_templates",
  {
    id: id(),
    templateKey: varchar("template_key", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    version: int("version").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: varchar("created_by", { length: 255 }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("uq_email_template_version").on(t.templateKey, t.version)],
);

export const emailQueue = mysqlTable(
  "email_queue",
  {
    id: id(),
    templateKey: varchar("template_key", { length: 100 }).notNull(),
    recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    body: text("body").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(3),
    nextAttemptAt: datetime("next_attempt_at", { mode: "date", fsp: 3 }),
    lastError: text("last_error"),
    sentAt: datetime("sent_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("ix_email_queue_status").on(t.status)],
);

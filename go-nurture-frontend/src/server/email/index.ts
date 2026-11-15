import nunjucks from "nunjucks";
import { Resend } from "resend";
import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import { getDb, schema } from "../db";
import { env } from "../env";
import { DEFAULT_TEMPLATES } from "./defaultTemplates";

const { emailTemplates, emailQueue, emailLogs } = schema;

// ---------------------------------------------------------------- rendering
// Same behaviour as the old Jinja environment: strict variables, no escaping.
const njk = new nunjucks.Environment(null, {
  autoescape: false,
  throwOnUndefined: true,
  trimBlocks: true,
  lstripBlocks: true,
});

export class TemplateVariableError extends Error {}

export function renderString(tpl: string, vars: Record<string, unknown>): string {
  try {
    return njk.renderString(tpl, vars).trim();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new TemplateVariableError(msg);
  }
}

export async function activeTemplate(key: string) {
  const [t] = await getDb()
    .select()
    .from(emailTemplates)
    .where(and(eq(emailTemplates.templateKey, key), eq(emailTemplates.isActive, true)))
    .orderBy(desc(emailTemplates.version))
    .limit(1);
  return t;
}

/** Render the active admin-edited version, falling back to the built-in default. */
export async function renderManaged(key: string, vars: Record<string, unknown>) {
  const t = await activeTemplate(key);
  const fallback = DEFAULT_TEMPLATES.find((d) => d.key === key);
  const subject = t?.subject ?? fallback?.subject ?? key;
  const body = t?.body ?? fallback?.body ?? "";
  return { subject: renderString(subject, vars), body: renderString(body, vars) };
}

// -------------------------------------------------------------------- queue
async function deliver(to: string, subject: string, body: string) {
  const key = env.resendApiKey;
  if (!key || key === "re_xxxxxxxxxxxx") {
    // Development fallback: no provider configured, treat as delivered.
    console.log(`=== EMAIL (console fallback) to ${to} ===\nSubject: ${subject}\n${body}\n=== END ===`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({ from: env.resendFrom, to, subject, text: body });
  if (error) throw new Error(error.message);
}

export async function enqueueEmail(templateKey: string, to: string, subject: string, body: string, maxAttempts = 3) {
  const id = crypto.randomUUID();
  await getDb()
    .insert(emailQueue)
    .values({
      id,
      templateKey,
      recipientEmail: to,
      subject,
      body,
      status: "pending",
      maxAttempts: Math.max(1, Math.min(maxAttempts, 10)),
      nextAttemptAt: new Date(),
    });
  const [item] = await getDb().select().from(emailQueue).where(eq(emailQueue.id, id)).limit(1);
  return item;
}

type QueueItem = typeof emailQueue.$inferSelect;

async function attempt(item: QueueItem) {
  const attempts = item.attempts + 1;
  try {
    await deliver(item.recipientEmail, item.subject, item.body);
    await getDb()
      .update(emailQueue)
      .set({ attempts, status: "sent", sentAt: new Date(), lastError: null })
      .where(eq(emailQueue.id, item.id));
    return true;
  } catch (e) {
    const failed = attempts >= item.maxAttempts;
    const delay = Math.min(3600, 60 * 2 ** (attempts - 1));
    await getDb()
      .update(emailQueue)
      .set({
        attempts,
        lastError: e instanceof Error ? e.message : String(e),
        status: failed ? "failed" : "pending",
        nextAttemptAt: failed ? null : new Date(Date.now() + delay * 1000),
      })
      .where(eq(emailQueue.id, item.id));
    return false;
  }
}

export async function processEmailQueue(batchSize = 25) {
  const items = await getDb()
    .select()
    .from(emailQueue)
    .where(
      and(
        eq(emailQueue.status, "pending"),
        or(isNull(emailQueue.nextAttemptAt), lte(emailQueue.nextAttemptAt, new Date())),
      ),
    )
    .orderBy(asc(emailQueue.createdAt))
    .limit(batchSize);
  for (const item of items) await attempt(item);
  return items.length;
}

async function queueAndSend(templateKey: string, to: string, subject: string, body: string) {
  const item = await enqueueEmail(templateKey, to, subject, body);
  return attempt(item);
}

async function logEmail(to: string, subject: string, body: string, type: string, status: string, error?: string) {
  try {
    await getDb()
      .insert(emailLogs)
      .values({ recipientEmail: to, subject, body: body.trim(), emailType: type, status, errorMessage: error ?? null });
  } catch (e) {
    console.error("[EmailLog] failed to log email", e);
  }
}

/** Render, queue, attempt once, and log. Never throws (callers run after the response). */
async function sendManaged(opts: {
  templateKey: string;
  to: string | undefined;
  vars: Record<string, unknown>;
  logType: string;
}) {
  if (!opts.to) {
    console.warn(`[email] no recipient for ${opts.templateKey}; skipped`);
    return false;
  }
  try {
    const { subject, body } = await renderManaged(opts.templateKey, opts.vars);
    const sent = await queueAndSend(opts.templateKey, opts.to, subject, body);
    await logEmail(
      opts.to,
      subject,
      body,
      opts.logType,
      sent ? "success" : "pending",
      sent ? undefined : "Email queued for delivery or failed",
    );
    return sent;
  } catch (e) {
    console.error(`[email] ${opts.templateKey} failed`, e);
    return false;
  }
}

// ------------------------------------------------------------ helpers/format
export const PROGRAM_NAMES: Record<string, string> = {
  birth_confidence: "Free Antenatal Education",
  breastfeeding_clinic: "Infant-Feeding Support",
  both: "Antenatal Education and Infant-Feeding Support",
};
const programName = (t: string) => PROGRAM_NAMES[t] ?? t;

const DAY_MS = 86_400_000;
const parseDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`);

/** Python's '%A, %d %B %Y' → "Sunday, 05 October 2026". */
export function formatDate(d: Date): string {
  const p = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("weekday")}, ${g("day")} ${g("month")} ${g("year")}`;
}

/** Class 1 is the start date; each following class is 7 days later (6 classes). */
export function computeClassSchedule(startDate: string, n = 6): Date[] {
  const s = parseDate(startDate).getTime();
  return Array.from({ length: n }, (_, i) => new Date(s + i * 7 * DAY_MS));
}

const scheduleLines = (start: string) =>
  computeClassSchedule(start)
    .map((d, i) => `Class ${i + 1}: ${formatDate(d)}`)
    .join("\n");

const cohortVars = (cohortType: string, cohortName: string, start: string) => ({
  program_name: programName(cohortType),
  cohort_name: cohortName,
  is_clinic: cohortType === "breastfeeding_clinic",
  date_text: formatDate(parseDate(start)),
  schedule_lines: scheduleLines(start),
});

// ---------------------------------------------------------------- senders
export const sendInviteEmail = (a: { to: string; name: string; organisationName: string; link: string }) =>
  sendManaged({
    templateKey: "partner_invite",
    to: a.to,
    logType: "partner_invite",
    vars: { recipient_name: a.name, organisation_name: a.organisationName, invite_link: a.link },
  });

export const sendPasswordResetEmail = (a: { to: string; name: string; link: string }) =>
  sendManaged({
    templateKey: "password_reset",
    to: a.to,
    logType: "password_reset",
    vars: { recipient_name: a.name, reset_link: a.link },
  });

export const sendReferralNotificationEmail = (a: {
  referenceNumber: string | null;
  partnerName: string;
  referralType: string;
  interpreterSupport: string | null;
}) =>
  sendManaged({
    templateKey: "referral_notification",
    to: env.contactEmail,
    logType: "referral",
    vars: {
      reference_number: a.referenceNumber,
      program_name: programName(a.referralType),
      partner_name: a.partnerName,
      interpreter_support: a.interpreterSupport,
    },
  });

export const sendDonationNotificationEmail = (a: {
  donorName: string | null;
  donorEmail: string | null;
  amount: number;
  currency: string;
  isAnonymous: boolean;
  message: string | null;
}) =>
  sendManaged({
    templateKey: "donation_notification",
    to: env.contactEmail,
    logType: "donation",
    vars: {
      donor_name: a.donorName,
      donor_email: a.donorEmail,
      amount: a.amount.toFixed(2),
      currency: a.currency.toUpperCase(),
      message: a.message,
    },
  });

export const sendReferralApprovalEmail = (a: {
  partnerEmail: string;
  partnerName: string;
  motherName: string;
  dueDate: string;
  cohortName: string | null;
  venueName: string | null;
  languageRequirement: string | null;
  requiresInterpreter: boolean;
  additionalNotes: string | null;
}) =>
  sendManaged({
    templateKey: "referral_approval",
    to: a.partnerEmail,
    logType: "referral_approval",
    vars: {
      partner_name: a.partnerName,
      mother_name: a.motherName,
      due_date: a.dueDate,
      language_requirement: a.languageRequirement,
      requires_interpreter: a.requiresInterpreter,
      cohort_name: a.cohortName,
      venue_name: a.venueName,
      additional_notes: a.additionalNotes,
    },
  });

export const sendContactEmail = (a: { name: string; email: string; subject: string; message: string }) =>
  sendManaged({
    templateKey: "contact",
    to: env.contactEmail,
    logType: "contact",
    vars: { sender_name: a.name, sender_email: a.email, message_subject: a.subject, message: a.message },
  });

export const sendFacilitatorAssignmentEmail = (a: {
  to: string;
  name: string;
  cohortName: string;
  cohortType: string;
  startDate: string;
  venueName: string | null;
}) =>
  sendManaged({
    templateKey: "facilitator_assignment",
    to: a.to,
    logType: "facilitator_assignment",
    vars: {
      facilitator_name: a.name,
      ...cohortVars(a.cohortType, a.cohortName, a.startDate),
      venue_line: a.venueName ? `Venue: ${a.venueName}` : "Venue: To be confirmed",
    },
  });

export const sendCohortAssignmentToMother = (a: {
  motherName: string;
  motherEmail: string;
  cohortName: string;
  cohortType: string;
  startDate: string;
  venueName: string | null;
  venueAddress: string | null;
  venueCity: string | null;
}) => {
  let venueBlock = "";
  if (a.venueName) {
    venueBlock = `Where: ${a.venueName}`;
    const bits = [a.venueAddress, a.venueCity].filter(Boolean).join(", ");
    if (bits) venueBlock += `\nAddress: ${bits}`;
  }
  return sendManaged({
    templateKey: "cohort_assignment_mother",
    to: a.motherEmail,
    logType: "cohort_assignment",
    vars: {
      mother_name: a.motherName,
      ...cohortVars(a.cohortType, a.cohortName, a.startDate),
      venue_block: venueBlock,
    },
  });
};

export const sendCohortAssignmentToPartner = (a: {
  partnerEmail: string;
  partnerName: string;
  motherName: string;
  motherEmail: string | null;
  cohortName: string;
  cohortType: string;
  startDate: string;
  venueName: string | null;
}) =>
  sendManaged({
    templateKey: "cohort_assignment_partner",
    to: a.partnerEmail,
    logType: "cohort_assignment_partner",
    vars: {
      partner_name: a.partnerName,
      mother_name: a.motherName,
      mother_email: a.motherEmail,
      ...cohortVars(a.cohortType, a.cohortName, a.startDate),
      venue_name: a.venueName,
    },
  });

/** Used by the admin test-send endpoint. */
export async function sendRaw(to: string, subject: string, body: string) {
  const key = env.resendApiKey;
  if (!key || key === "re_xxxxxxxxxxxx") return null;
  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({ from: env.resendFrom, to, subject, text: body });
  if (error) throw new Error(error.message);
  return data;
}

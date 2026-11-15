import { eq, inArray } from "drizzle-orm";
import { getDb, schema } from "../db";
import { badRequest } from "../http";
import { camelPick, snakeRow } from "../util";

const { referrals, cohorts, venues } = schema;

export type Referral = typeof referrals.$inferSelect;

export const referralResponse = (r: Referral) => snakeRow(r);

/** Adds cohort_name / venue_name / clinic_cohort_name like the old API did. */
export async function enrichReferrals(rows: Referral[]) {
  const db = getDb();
  const cohortIds = [...new Set(rows.flatMap((r) => [r.cohortId, r.clinicCohortId]).filter(Boolean))] as string[];
  const cohortRows = cohortIds.length ? await db.select().from(cohorts).where(inArray(cohorts.id, cohortIds)) : [];
  const venueIds = [...new Set(cohortRows.map((c) => c.venueId).filter(Boolean))] as string[];
  const venueRows = venueIds.length ? await db.select().from(venues).where(inArray(venues.id, venueIds)) : [];
  const cohortById = new Map(cohortRows.map((c) => [c.id, c]));
  const venueById = new Map(venueRows.map((v) => [v.id, v]));

  return rows.map((r) => {
    const cohort = r.cohortId ? cohortById.get(r.cohortId) : undefined;
    const venue = cohort?.venueId ? venueById.get(cohort.venueId) : undefined;
    const clinic = r.clinicCohortId ? cohortById.get(r.clinicCohortId) : undefined;
    return {
      ...referralResponse(r),
      cohort_name: cohort?.name ?? null,
      venue_name: venue?.name ?? null,
      clinic_cohort_name: clinic?.name ?? null,
    };
  });
}

export async function getVenue(id: string | null | undefined) {
  if (!id) return undefined;
  const [v] = await getDb().select().from(venues).where(eq(venues.id, id)).limit(1);
  return v;
}

export const memberOf = (r: Referral) => ({
  id: r.id,
  mother_name: r.motherName,
  mother_phone: r.motherPhone,
  estimated_due_date: r.estimatedDueDate,
  status: r.status,
  language_requirement: r.languageRequirement,
  requires_interpreter: r.requiresInterpreter,
  created_at: r.createdAt?.toISOString() ?? null,
});

/**
 * Turn an edit request (snake_case, only sent fields) into a column patch,
 * keeping interpreter_support and the legacy requires_interpreter flag in sync.
 */
export function buildReferralPatch(current: Referral, updates: Record<string, unknown>) {
  if ("mother_name" in updates && !updates.mother_name) throw badRequest("Name cannot be empty");
  const patch: Record<string, unknown> = camelPick(updates);
  if ("interpreter_support" in updates) {
    patch.requiresInterpreter = updates.interpreter_support === "yes";
  } else if ("requires_interpreter" in updates) {
    if (updates.requires_interpreter) patch.interpreterSupport = "yes";
    else if (current.interpreterSupport === "yes") patch.interpreterSupport = "no";
    patch.requiresInterpreter = !!updates.requires_interpreter;
  }
  return patch as Partial<typeof referrals.$inferInsert>;
}

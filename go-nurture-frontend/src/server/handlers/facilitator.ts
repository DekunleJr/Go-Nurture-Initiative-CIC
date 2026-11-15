import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "../db";
import { currentFacilitator, facilitatorResponse } from "../auth";
import { notFound, parseBody, route } from "../http";
import { computeClassSchedule } from "../email";
import { snakeRow } from "../util";
import { sessionReviewSchema } from "../validation";
import { memberOf } from "./shared";

const { cohorts, referrals, venues, sessionReviews } = schema;

route("GET", "/api/facilitator/me", async (ctx) => facilitatorResponse(await currentFacilitator(ctx)));

route("GET", "/api/facilitator/my-cohorts", async (ctx) => {
  const f = await currentFacilitator(ctx);
  const db = getDb();
  const mine = await db.select().from(cohorts).where(eq(cohorts.facilitatorId, f.id)).orderBy(asc(cohorts.startDate));
  const ids = mine.map((c) => c.id);
  const venueIds = [...new Set(mine.map((c) => c.venueId).filter(Boolean))] as string[];
  const venueRows = venueIds.length ? await db.select().from(venues).where(inArray(venues.id, venueIds)) : [];
  const venueById = new Map(venueRows.map((v) => [v.id, v]));

  const refs = ids.length
    ? await db
        .select()
        .from(referrals)
        .where(or(inArray(referrals.cohortId, ids), inArray(referrals.clinicCohortId, ids)))
        .orderBy(asc(referrals.motherName))
    : [];

  return mine.map((c) => {
    const venue = c.venueId ? venueById.get(c.venueId) : undefined;
    const schedule =
      c.cohortType === "breastfeeding_clinic"
        ? [c.startDate]
        : computeClassSchedule(c.startDate).map((d) => d.toISOString().slice(0, 10));
    return {
      ...snakeRow(c),
      schedule,
      venue_name: venue?.name ?? null,
      venue_address: venue?.address ?? null,
      venue_city: venue?.city ?? null,
      members: refs
        .filter((r) => r.cohortId === c.id || r.clinicCohortId === c.id)
        .map((r) => {
          const { created_at: _omit, ...m } = memberOf(r);
          void _omit;
          return m;
        }),
    };
  });
});

route("POST", "/api/facilitator/reviews", async (ctx) => {
  const f = await currentFacilitator(ctx);
  const data = await parseBody(ctx, sessionReviewSchema);
  const db = getDb();
  const [cohort] = await db
    .select()
    .from(cohorts)
    .where(and(eq(cohorts.id, data.cohort_id), eq(cohorts.facilitatorId, f.id)))
    .limit(1);
  if (!cohort) throw notFound("Cohort not found or not assigned to you");

  const sessionDate = new Date(data.session_date);
  const values = {
    sessionDate,
    weekNumber: data.week_number ?? null,
    mode: data.mode ?? null,
    venueOrPlatform: data.venue_or_platform ?? null,
    leadFacilitator: data.lead_facilitator ?? null,
    coFacilitator: data.co_facilitator ?? null,
    startTime: data.start_time ?? null,
    finishTime: data.finish_time ?? null,
    registeredCount: data.registered_count ?? null,
    attendedCount: data.attended_count ?? null,
    supporterCount: data.supporter_count ?? null,
    reasonableAdjustments: data.reasonable_adjustments ?? null,
    fidelityChecked: data.fidelity_checked ?? [],
    qualityRatings: data.quality_ratings ?? {},
    deviations: data.deviations ?? null,
    incidents: data.incidents ?? [],
    reflection: data.reflection ?? {},
    status: data.status,
    ...(data.status === "submitted" ? { submittedAt: new Date() } : {}),
  };

  const [existing] = await db
    .select()
    .from(sessionReviews)
    .where(
      and(
        eq(sessionReviews.cohortId, data.cohort_id),
        eq(sessionReviews.sessionDate, sessionDate),
        eq(sessionReviews.facilitatorId, f.id),
      ),
    )
    .limit(1);

  if (existing) {
    await db.update(sessionReviews).set(values).where(eq(sessionReviews.id, existing.id));
    return { message: "Review updated", review_id: existing.id, status: data.status };
  }
  const id = crypto.randomUUID();
  await db.insert(sessionReviews).values({ id, cohortId: data.cohort_id, facilitatorId: f.id, ...values });
  return { message: "Review submitted", review_id: id, status: data.status };
});

route("GET", "/api/facilitator/reviews", async (ctx) => {
  const f = await currentFacilitator(ctx);
  const db = getDb();
  const rows = await db
    .select()
    .from(sessionReviews)
    .where(eq(sessionReviews.facilitatorId, f.id))
    .orderBy(desc(sessionReviews.sessionDate));
  const ids = [...new Set(rows.map((r) => r.cohortId))];
  const cs = ids.length ? await db.select().from(cohorts).where(inArray(cohorts.id, ids)) : [];
  const nameById = new Map(cs.map((c) => [c.id, c.name]));
  return rows.map((r) => ({
    ...snakeRow(r),
    cohort_name: nameById.get(r.cohortId) ?? null,
    facilitator_name: f.name,
  }));
});

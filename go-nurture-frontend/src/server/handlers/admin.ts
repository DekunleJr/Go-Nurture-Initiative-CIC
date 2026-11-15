import { and, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { currentAdmin, facilitatorResponse, partnerResponse } from "../auth";
import { ApiError, badRequest, intParam, notFound, parseBody, route, uuidParam, type Ctx } from "../http";
import {
  TemplateVariableError,
  enqueueEmail,
  processEmailQueue,
  renderString,
  activeTemplate,
  sendCohortAssignmentToMother,
  sendCohortAssignmentToPartner,
  sendFacilitatorAssignmentEmail,
  sendRaw,
  sendReferralApprovalEmail,
} from "../email";
import { camelPick, snakeRow } from "../util";
import {
  cohortCreateSchema,
  cohortUpdateSchema,
  communityPartnerCreateSchema,
  communityPartnerUpdateSchema,
  emailPreviewSchema,
  emailTemplateUpdateSchema,
  emailTestSendSchema,
  facilitatorAssignSchema,
  partnerUpdateSchema,
  referralStatusSchema,
  referralUpdateSchema,
  venueCreateSchema,
  venueUpdateSchema,
} from "../validation";
import { buildReferralPatch, enrichReferrals, getVenue, memberOf, referralResponse } from "./shared";
import { geocodeAddress } from "../geocode";
import { env } from "../env";

const {
  partnerOrganisations: partners,
  facilitators,
  referrals,
  contactSubmissions,
  donations,
  venues,
  cohorts,
  sessionReviews,
  emailLogs,
  emailTemplates,
  emailQueue,
  communityPartners,
} = schema;

const admin = (path: string) => `/api/admin${path}`;
const page = (ctx: Ctx, maxLimit = 100) => ({
  skip: intParam(ctx.url, "skip", 0, 0, 1_000_000),
  limit: intParam(ctx.url, "limit", 50, 1, maxLimit),
});
// Old endpoints for referrals/contacts/donations/email-logs accepted any limit; keep generous.
const loosePage = (ctx: Ctx) => page(ctx, 1000);

// --------------------------------------------------------- email templates
route("GET", admin("/email-templates"), async (ctx) => {
  await currentAdmin(ctx);
  const rows = await getDb()
    .select()
    .from(emailTemplates)
    .orderBy(emailTemplates.templateKey, desc(emailTemplates.version));
  return rows.map((r) => snakeRow(r));
});

route("PATCH", admin("/email-templates/:key"), async (ctx) => {
  const adm = await currentAdmin(ctx);
  const data = await parseBody(ctx, emailTemplateUpdateSchema);
  const key = ctx.params.key;
  const current = await activeTemplate(key);
  if (!current) throw notFound("Email template not found");
  const db = getDb();
  const id = crypto.randomUUID();
  await db.update(emailTemplates).set({ isActive: false }).where(eq(emailTemplates.id, current.id));
  await db.insert(emailTemplates).values({
    id,
    templateKey: key,
    name: data.name,
    subject: data.subject,
    body: data.body,
    version: current.version + 1,
    isActive: true,
    createdBy: adm.email,
  });
  const [row] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return snakeRow(row);
});

async function renderTemplate(key: string, variables: Record<string, unknown>) {
  const t = await activeTemplate(key);
  if (!t) throw notFound("Email template not found");
  try {
    return { subject: renderString(t.subject, variables), body: renderString(t.body, variables) };
  } catch (e) {
    if (e instanceof TemplateVariableError) {
      const m = /undefined or null value|attempted to output null or undefined value/i.test(e.message)
        ? e.message
        : e.message;
      throw new ApiError(422, `Missing template variable: ${m}`);
    }
    throw e;
  }
}

route("POST", admin("/email-templates/:key/preview"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, emailPreviewSchema);
  const { subject, body } = await renderTemplate(ctx.params.key, data.variables);
  return { template_key: ctx.params.key, subject, body };
});

route("POST", admin("/email-templates/:key/test-send"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, emailTestSendSchema);
  const { subject, body } = await renderTemplate(ctx.params.key, data.variables);
  if (!env.resendApiKey || env.resendApiKey === "re_xxxxxxxxxxxx") {
    throw new ApiError(503, "Email provider is not configured");
  }
  try {
    const response = await sendRaw(data.recipient_email, subject, body);
    return { message: "Test email sent", provider_response: JSON.stringify(response) };
  } catch (e) {
    throw new ApiError(502, `Test email failed: ${e instanceof Error ? e.message : String(e)}`);
  }
});

route("POST", admin("/email-templates/:key/queue"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, emailTestSendSchema);
  const { subject, body } = await renderTemplate(ctx.params.key, data.variables);
  return snakeRow(await enqueueEmail(ctx.params.key, data.recipient_email, subject, body), ["body", "updatedAt"]);
});

const queueResponse = (r: typeof emailQueue.$inferSelect) => snakeRow(r, ["body", "updatedAt"]);

route("GET", admin("/email-queue"), async (ctx) => {
  await currentAdmin(ctx);
  const status = ctx.url.searchParams.get("status");
  const limit = intParam(ctx.url, "limit", 50, 1, 100);
  const rows = await getDb()
    .select()
    .from(emailQueue)
    .where(status ? eq(emailQueue.status, status) : undefined)
    .orderBy(desc(emailQueue.createdAt))
    .limit(limit);
  return rows.map(queueResponse);
});

route("POST", admin("/email-queue/process"), async (ctx) => {
  await currentAdmin(ctx);
  return { processed: await processEmailQueue() };
});

route("POST", admin("/email-queue/:id/retry"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "queue ID");
  const db = getDb();
  const [item] = await db.select().from(emailQueue).where(eq(emailQueue.id, id)).limit(1);
  if (!item) throw notFound("Queued email not found");
  await db.update(emailQueue).set({ status: "pending", nextAttemptAt: new Date(), lastError: null }).where(eq(emailQueue.id, id));
  const [fresh] = await db.select().from(emailQueue).where(eq(emailQueue.id, id)).limit(1);
  return queueResponse(fresh);
});

// --------------------------------------------------------------- referrals
route("GET", admin("/referrals"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = loosePage(ctx);
  const statusFilter = ctx.url.searchParams.get("status_filter");
  const partnerId = ctx.url.searchParams.get("partner_id");
  const where = and(
    statusFilter ? eq(referrals.status, statusFilter) : undefined,
    partnerId ? eq(referrals.partnerId, uuidParam(partnerId, "partner ID")) : undefined,
  );
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(referrals).where(where);
  const rows = await db.select().from(referrals).where(where).orderBy(desc(referrals.createdAt)).limit(limit).offset(skip);

  const partnerIds = [...new Set(rows.map((r) => r.partnerId))];
  const ps = partnerIds.length ? await db.select().from(partners).where(inArray(partners.id, partnerIds)) : [];
  const nameById = new Map(ps.map((p) => [p.id, p.organisationName]));
  const enriched = (await enrichReferrals(rows)).map((r, i) => ({
    ...r,
    partner_name: nameById.get(rows[i].partnerId) ?? null,
  }));
  return { total, skip, limit, referrals: enriched };
});

route("PATCH", admin("/referrals/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "referral ID");
  const update = await parseBody(ctx, referralStatusSchema);
  const db = getDb();
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
  if (!referral) throw notFound("Referral not found");

  let target: typeof cohorts.$inferSelect | undefined;
  if (update.cohort_id) {
    [target] = await db.select().from(cohorts).where(eq(cohorts.id, update.cohort_id)).limit(1);
    if (!target) throw notFound("Cohort not found");
  }

  // One cohort per programme type: assigning replaces the previous one of that type.
  const patch: Partial<typeof referrals.$inferInsert> = { status: update.status };
  let changed = false;
  if (target) {
    if (target.cohortType === "breastfeeding_clinic") {
      changed = update.cohort_id !== referral.clinicCohortId;
      patch.clinicCohortId = target.id;
    } else {
      changed = update.cohort_id !== referral.cohortId;
      patch.cohortId = target.id;
    }
  }
  await db.update(referrals).set(patch).where(eq(referrals.id, id));
  const [fresh] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
  const [partner] = await db.select().from(partners).where(eq(partners.id, fresh.partnerId)).limit(1);

  if (changed && target) {
    const venue = await getVenue(target.venueId);
    if (partner) {
      ctx.after.push(() =>
        sendCohortAssignmentToPartner({
          partnerEmail: partner.email,
          partnerName: partner.organisationName,
          motherName: fresh.motherName,
          motherEmail: fresh.motherEmail,
          cohortName: target.name,
          cohortType: target.cohortType,
          startDate: target.startDate,
          venueName: venue?.name ?? null,
        }),
      );
    }
    if (fresh.motherEmail) {
      const email = fresh.motherEmail;
      ctx.after.push(() =>
        sendCohortAssignmentToMother({
          motherName: fresh.motherName,
          motherEmail: email,
          cohortName: target.name,
          cohortType: target.cohortType,
          startDate: target.startDate,
          venueName: venue?.name ?? null,
          venueAddress: venue?.address ?? null,
          venueCity: venue?.city ?? null,
        }),
      );
    }
  } else if (update.status === "approved" && !update.cohort_id && partner) {
    ctx.after.push(() =>
      sendReferralApprovalEmail({
        partnerEmail: partner.email,
        partnerName: partner.organisationName,
        motherName: fresh.motherName,
        dueDate: fresh.estimatedDueDate ?? "",
        cohortName: null,
        venueName: null,
        languageRequirement: fresh.languageRequirement,
        requiresInterpreter: fresh.requiresInterpreter,
        additionalNotes: fresh.additionalNotes,
      }),
    );
  }
  return { message: "Referral updated successfully", referral_id: id };
});

route("PATCH", admin("/referrals/:id/edit"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "referral ID");
  const update = await parseBody(ctx, referralUpdateSchema);
  const db = getDb();
  const [referral] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
  if (!referral) throw notFound("Referral not found");
  await db.update(referrals).set(buildReferralPatch(referral, update as Record<string, unknown>)).where(eq(referrals.id, id));
  const [fresh] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);
  return { message: "Referral updated successfully", referral: referralResponse(fresh) };
});

// ---------------------------------------------------- contacts / donations
route("GET", admin("/contacts"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = loosePage(ctx);
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(contactSubmissions);
  const rows = await db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt)).limit(limit).offset(skip);
  return { total, skip, limit, contacts: rows.map((r) => snakeRow(r)) };
});

route("GET", admin("/donations"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = loosePage(ctx);
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(donations);
  const [{ sum }] = await db.select({ sum: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations);
  const rows = await db.select().from(donations).orderBy(desc(donations.createdAt)).limit(limit).offset(skip);
  return {
    total,
    total_amount: Number(sum),
    skip,
    limit,
    donations: rows.map((d) => snakeRow(d, ["paymentIntentId"])),
  };
});

// ---------------------------------------------------------------- partners
route("GET", admin("/partners"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = page(ctx);
  const rows = await getDb().select().from(partners).orderBy(desc(partners.createdAt)).limit(limit).offset(skip);
  return rows.map(partnerResponse);
});

async function findPartner(idParam: string) {
  const id = uuidParam(idParam, "partner ID");
  const [p] = await getDb().select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!p) throw notFound("Partner not found");
  return p;
}

route("PATCH", admin("/partners/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const p = await findPartner(ctx.params.id);
  const data = await parseBody(ctx, partnerUpdateSchema);
  const patch = camelPick(data as Record<string, unknown>);
  if (Object.keys(patch).length) await getDb().update(partners).set(patch).where(eq(partners.id, p.id));
  return { message: "Partner updated successfully", partner_id: p.id };
});

route("PATCH", admin("/partners/:id/activate"), async (ctx) => {
  await currentAdmin(ctx);
  const p = await findPartner(ctx.params.id);
  await getDb().update(partners).set({ isActive: true }).where(eq(partners.id, p.id));
  return { message: "Partner activated successfully" };
});

route("PATCH", admin("/partners/:id/deactivate"), async (ctx) => {
  await currentAdmin(ctx);
  const p = await findPartner(ctx.params.id);
  await getDb().update(partners).set({ isActive: false }).where(eq(partners.id, p.id));
  return { message: "Partner deactivated successfully" };
});

// ------------------------------------------------------------------- stats
route("GET", admin("/stats"), async (ctx) => {
  await currentAdmin(ctx);
  const db = getDb();
  const n = async (q: Promise<{ c: number }[]>) => Number((await q)[0]?.c ?? 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);

  const [
    totalPartners,
    activePartners,
    totalReferrals,
    pendingReferrals,
    recentReferrals,
    totalDonations,
    totalContacts,
    totalVenues,
    totalCohorts,
    totalFacilitators,
  ] = await Promise.all([
    n(db.select({ c: count() }).from(partners)),
    n(db.select({ c: count() }).from(partners).where(eq(partners.isActive, true))),
    n(db.select({ c: count() }).from(referrals)),
    n(db.select({ c: count() }).from(referrals).where(eq(referrals.status, "pending"))),
    n(db.select({ c: count() }).from(referrals).where(gte(referrals.createdAt, thirtyDaysAgo))),
    n(db.select({ c: count() }).from(donations)),
    n(db.select({ c: count() }).from(contactSubmissions)),
    n(db.select({ c: count() }).from(venues)),
    n(db.select({ c: count() }).from(cohorts)),
    n(db.select({ c: count() }).from(facilitators)),
  ]);
  const [{ sum }] = await db.select({ sum: sql<number>`coalesce(sum(${donations.amount}), 0)` }).from(donations);
  const byStatus = await db.select({ status: referrals.status, c: count() }).from(referrals).groupBy(referrals.status);

  return {
    total_partners: totalPartners,
    active_partners: activePartners,
    total_referrals: totalReferrals,
    pending_referrals: pendingReferrals,
    recent_referrals: recentReferrals,
    total_donations: totalDonations,
    total_donation_amount: Number(sum),
    total_contacts: totalContacts,
    total_venues: totalVenues,
    total_cohorts: totalCohorts,
    total_facilitators: totalFacilitators,
    referrals_by_status: Object.fromEntries(byStatus.map((r) => [r.status, Number(r.c)])),
  };
});

// ------------------------------------------------------------------ venues
route("GET", admin("/venues"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = page(ctx);
  const rows = await getDb().select().from(venues).limit(limit).offset(skip);
  return rows.map((v) => snakeRow(v));
});

route("POST", admin("/venues"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, venueCreateSchema);
  const values = camelPick(data) as Partial<typeof venues.$inferInsert>;
  if (!values.latitude || !values.longitude) {
    const c = await geocodeAddress(data.address, data.city, data.postcode);
    if (c) {
      values.latitude = c.lat;
      values.longitude = c.lon;
    }
  }
  const id = crypto.randomUUID();
  await getDb().insert(venues).values({ ...(values as typeof venues.$inferInsert), id });
  return { message: "Venue created successfully", venue_id: id };
});

route("PATCH", admin("/venues/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "venue ID");
  const data = await parseBody(ctx, venueUpdateSchema);
  const db = getDb();
  const [venue] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  if (!venue) throw notFound("Venue not found");
  const patch = camelPick(data) as Partial<typeof venues.$inferInsert>;
  const merged = { ...venue, ...patch };
  if (!merged.latitude || !merged.longitude) {
    const c = await geocodeAddress(merged.address, merged.city, merged.postcode);
    if (c) {
      patch.latitude = c.lat;
      patch.longitude = c.lon;
    }
  }
  if (Object.keys(patch).length) await db.update(venues).set(patch).where(eq(venues.id, id));
  const [fresh] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  return { message: "Venue updated successfully", venue: snakeRow(fresh) };
});

route("DELETE", admin("/venues/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "venue ID");
  const db = getDb();
  const [venue] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  if (!venue) throw notFound("Venue not found");
  try {
    await db.delete(venues).where(eq(venues.id, id));
  } catch {
    throw badRequest("This venue is used by one or more cohorts and cannot be deleted.");
  }
  return { message: "Venue deleted successfully", venue_id: id };
});

// -------------------------------------------------- session reviews / people
route("GET", admin("/session-reviews"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = page(ctx);
  const db = getDb();
  const rows = await db.select().from(sessionReviews).orderBy(desc(sessionReviews.sessionDate)).limit(limit).offset(skip);
  const cIds = [...new Set(rows.map((r) => r.cohortId))];
  const fIds = [...new Set(rows.map((r) => r.facilitatorId))];
  const cs = cIds.length ? await db.select().from(cohorts).where(inArray(cohorts.id, cIds)) : [];
  const fs = fIds.length ? await db.select().from(facilitators).where(inArray(facilitators.id, fIds)) : [];
  const cName = new Map(cs.map((c) => [c.id, c.name]));
  const fName = new Map(fs.map((f) => [f.id, f.name]));
  return rows.map((r) => ({
    ...snakeRow(r),
    cohort_name: cName.get(r.cohortId) ?? null,
    facilitator_name: fName.get(r.facilitatorId) ?? null,
  }));
});

route("GET", admin("/facilitators"), async (ctx) => {
  await currentAdmin(ctx);
  const rows = await getDb().select().from(facilitators).orderBy(desc(facilitators.createdAt));
  return rows.map(facilitatorResponse);
});

route("POST", admin("/cohorts/:id/assign-facilitator"), async (ctx) => {
  await currentAdmin(ctx);
  const cohortId = uuidParam(ctx.params.id, "cohort ID");
  const data = await parseBody(ctx, facilitatorAssignSchema);
  const db = getDb();
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
  if (!cohort) throw notFound("Cohort not found");
  const [fac] = await db.select().from(facilitators).where(eq(facilitators.id, data.facilitator_id)).limit(1);
  if (!fac) throw notFound("Facilitator not found");

  await db.update(cohorts).set({ facilitatorId: fac.id }).where(eq(cohorts.id, cohortId));
  const venue = await getVenue(cohort.venueId);
  ctx.after.push(() =>
    sendFacilitatorAssignmentEmail({
      to: fac.email,
      name: fac.name,
      cohortName: cohort.name,
      cohortType: cohort.cohortType,
      startDate: cohort.startDate,
      venueName: venue?.name ?? null,
    }),
  );
  return { message: `${fac.name} assigned to ${cohort.name}`, facilitator: facilitatorResponse(fac) };
});

// ----------------------------------------------------------------- cohorts
route("GET", admin("/cohorts"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = page(ctx);
  const db = getDb();
  const rows = await db.select().from(cohorts).orderBy(desc(cohorts.startDate)).limit(limit).offset(skip);
  const ids = rows.map((c) => c.id);
  const vIds = [...new Set(rows.map((c) => c.venueId).filter(Boolean))] as string[];
  const fIds = [...new Set(rows.map((c) => c.facilitatorId).filter(Boolean))] as string[];
  const vs = vIds.length ? await db.select().from(venues).where(inArray(venues.id, vIds)) : [];
  const fs = fIds.length ? await db.select().from(facilitators).where(inArray(facilitators.id, fIds)) : [];
  const refs = ids.length
    ? await db
        .select()
        .from(referrals)
        .where(or(inArray(referrals.cohortId, ids), inArray(referrals.clinicCohortId, ids)))
        .orderBy(desc(referrals.createdAt))
    : [];
  const vById = new Map(vs.map((v) => [v.id, v]));
  const fById = new Map(fs.map((f) => [f.id, f]));
  return rows.map((c) => {
    const v = c.venueId ? vById.get(c.venueId) : undefined;
    return {
      ...snakeRow(c),
      venue_name: v?.name ?? null,
      venue_address: v?.address ?? null,
      venue_city: v?.city ?? null,
      facilitator_name: c.facilitatorId ? (fById.get(c.facilitatorId)?.name ?? null) : null,
      members: refs.filter((r) => r.cohortId === c.id || r.clinicCohortId === c.id).map(memberOf),
    };
  });
});

route("POST", admin("/cohorts"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, cohortCreateSchema);
  const id = crypto.randomUUID();
  await getDb()
    .insert(cohorts)
    .values({ ...(camelPick(data) as typeof cohorts.$inferInsert), id });
  return { message: "Cohort created successfully", cohort_id: id };
});

route("PATCH", admin("/cohorts/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "cohort ID");
  const data = await parseBody(ctx, cohortUpdateSchema);
  const db = getDb();
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  if (!cohort) throw notFound("Cohort not found");
  const patch = camelPick(data as Record<string, unknown>);
  if (Object.keys(patch).length) await db.update(cohorts).set(patch).where(eq(cohorts.id, id));
  const [fresh] = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  return { message: "Cohort updated successfully", cohort: snakeRow(fresh) };
});

route("DELETE", admin("/cohorts/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "cohort ID");
  const db = getDb();
  const [cohort] = await db.select().from(cohorts).where(eq(cohorts.id, id)).limit(1);
  if (!cohort) throw notFound("Cohort not found");
  try {
    await db.delete(cohorts).where(eq(cohorts.id, id));
  } catch {
    throw badRequest("This cohort has referrals or reviews attached and cannot be deleted.");
  }
  return { message: "Cohort deleted successfully", cohort_id: id };
});

// -------------------------------------------------------------- email logs
route("GET", admin("/email-logs"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = loosePage(ctx);
  const type = ctx.url.searchParams.get("email_type");
  const where = type ? eq(emailLogs.emailType, type) : undefined;
  const db = getDb();
  const [{ total }] = await db.select({ total: count() }).from(emailLogs).where(where);
  const rows = await db.select().from(emailLogs).where(where).orderBy(desc(emailLogs.createdAt)).limit(limit).offset(skip);
  return {
    total,
    skip,
    limit,
    logs: rows.map((l) => ({
      id: l.id,
      recipient_email: l.recipientEmail,
      subject: l.subject,
      email_type: l.emailType,
      status: l.status,
      error_message: l.errorMessage,
      created_at: l.createdAt?.toISOString() ?? null,
    })),
  };
});

// -------------------------------------------------------- community partners
route("GET", admin("/community-partners"), async (ctx) => {
  await currentAdmin(ctx);
  const { skip, limit } = page(ctx);
  const rows = await getDb().select().from(communityPartners).orderBy(desc(communityPartners.createdAt)).limit(limit).offset(skip);
  return rows.map((p) => snakeRow(p, ["updatedAt"]));
});

route("POST", admin("/community-partners"), async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, communityPartnerCreateSchema);
  const id = crypto.randomUUID();
  await getDb().insert(communityPartners).values({ id, name: data.name });
  return { message: "Community partner created successfully", partner_id: id };
});

route("PATCH", admin("/community-partners/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "partner ID");
  const data = await parseBody(ctx, communityPartnerUpdateSchema);
  const db = getDb();
  const [p] = await db.select().from(communityPartners).where(eq(communityPartners.id, id)).limit(1);
  if (!p) throw notFound("Community partner not found");
  const patch = camelPick(data as Record<string, unknown>);
  if (Object.keys(patch).length) await db.update(communityPartners).set(patch).where(eq(communityPartners.id, id));
  return { message: "Community partner updated successfully", partner_id: id };
});

route("DELETE", admin("/community-partners/:id"), async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.id, "partner ID");
  const db = getDb();
  const [p] = await db.select().from(communityPartners).where(eq(communityPartners.id, id)).limit(1);
  if (!p) throw notFound("Community partner not found");
  await db.delete(communityPartners).where(eq(communityPartners.id, id));
  return { message: "Community partner deleted successfully", partner_id: id };
});

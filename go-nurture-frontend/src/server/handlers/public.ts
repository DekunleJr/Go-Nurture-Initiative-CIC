import { randomInt } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import Stripe from "stripe";
import { getDb, schema } from "../db";
import { env } from "../env";
import { currentAdmin, currentPartner } from "../auth";
import { ApiError, badRequest, forbidden, notFound, parseBody, route, uuidParam } from "../http";
import { rateLimit } from "../rateLimit";
import { sendContactEmail, sendDonationNotificationEmail, sendReferralNotificationEmail } from "../email";
import { buildReferralPatch, enrichReferrals, referralResponse } from "./shared";
import { camelPick, snakeRow } from "../util";
import {
  contactSchema,
  donationCreateSchema,
  referralCreateSchema,
  referralUpdateSchema,
} from "../validation";

const { referrals, contactSubmissions, donations, venues, communityPartners } = schema;

// ------------------------------------------------------------- community
route("GET", "/api/community/partners", async () => {
  const rows = await getDb()
    .select()
    .from(communityPartners)
    .where(eq(communityPartners.isActive, true))
    .orderBy(desc(communityPartners.createdAt));
  return rows.map((p) => snakeRow(p, ["updatedAt"]));
});

// ----------------------------------------------------------------- venues
route("GET", "/api/venues", async () => {
  const rows = await getDb().select().from(venues).where(eq(venues.isActive, true));
  return rows.map((v) => snakeRow(v, ["capacity", "createdAt"]));
});

// ---------------------------------------------------------------- contact
route(
  "POST",
  "/api/contact",
  async (ctx) => {
    rateLimit(ctx.req, "contact", 10);
    const data = await parseBody(ctx, contactSchema);
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(contactSubmissions).values({
      id,
      name: data.name,
      email: data.email,
      subject: data.subject ?? null,
      message: data.message,
    });
    const [row] = await db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id)).limit(1);
    ctx.after.push(() =>
      sendContactEmail({ name: data.name, email: data.email, subject: data.subject ?? "", message: data.message }),
    );
    return snakeRow(row);
  },
  201,
);

// -------------------------------------------------------------- referrals
// No 0/O/1/I so references are easy to read out over the phone.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateReference = () =>
  `GNI-${new Date().getUTCFullYear()}-${Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("")}`;

route(
  "POST",
  "/api/referrals",
  async (ctx) => {
    rateLimit(ctx.req, "referrals", 20);
    const partner = await currentPartner(ctx);
    const data = await parseBody(ctx, referralCreateSchema);
    if (!data.consent_obtained) {
      throw badRequest("You must confirm that explicit consent has been obtained from the mother");
    }
    const db = getDb();

    let reference: string | undefined;
    for (let i = 0; i < 5; i++) {
      const candidate = generateReference();
      const [hit] = await db.select({ id: referrals.id }).from(referrals).where(eq(referrals.referenceNumber, candidate)).limit(1);
      if (!hit) {
        reference = candidate;
        break;
      }
    }
    if (!reference) throw new ApiError(500, "Could not generate a referral reference. Please try again.");

    const { consent_obtained, ...rest } = data;
    const id = crypto.randomUUID();
    await db.insert(referrals).values({
      ...(camelPick(rest) as Partial<typeof referrals.$inferInsert>),
      id,
      partnerId: partner.id,
      referenceNumber: reference,
      requiresInterpreter: data.interpreter_support === "yes",
      consentObtained: consent_obtained,
    } as typeof referrals.$inferInsert);
    const [row] = await db.select().from(referrals).where(eq(referrals.id, id)).limit(1);

    // Admin notification deliberately contains no personal details.
    ctx.after.push(() =>
      sendReferralNotificationEmail({
        referenceNumber: row.referenceNumber,
        partnerName: partner.organisationName,
        referralType: row.referralType,
        interpreterSupport: row.interpreterSupport,
      }),
    );
    return referralResponse(row);
  },
  201,
);

route("GET", "/api/referrals", async (ctx) => {
  const partner = await currentPartner(ctx);
  const rows = await getDb()
    .select()
    .from(referrals)
    .where(eq(referrals.partnerId, partner.id))
    .orderBy(desc(referrals.createdAt));
  return enrichReferrals(rows);
});

async function ownReferral(ctx: Parameters<typeof currentPartner>[0], idParam: string) {
  const partner = await currentPartner(ctx);
  const id = uuidParam(idParam, "referral ID");
  const [row] = await getDb().select().from(referrals).where(eq(referrals.id, id)).limit(1);
  if (!row) throw notFound("Referral not found");
  if (row.partnerId !== partner.id) throw forbidden("Not your referral");
  return row;
}

route("GET", "/api/referrals/:id", async (ctx) => referralResponse(await ownReferral(ctx, ctx.params.id)));

route("PATCH", "/api/referrals/:id", async (ctx) => {
  const row = await ownReferral(ctx, ctx.params.id);
  const update = await parseBody(ctx, referralUpdateSchema);
  if (row.status === "completed" || row.status === "declined") {
    throw badRequest("This referral can no longer be edited because it has been completed or declined.");
  }
  const db = getDb();
  await db.update(referrals).set(buildReferralPatch(row, update as Record<string, unknown>)).where(eq(referrals.id, row.id));
  const [fresh] = await db.select().from(referrals).where(eq(referrals.id, row.id)).limit(1);
  return referralResponse(fresh);
});

// -------------------------------------------------------------- donations
const stripeClient = () => {
  if (!env.stripeSecretKey) return null;
  return new Stripe(env.stripeSecretKey);
};

route("POST", "/api/donations/create-payment-intent", async (ctx) => {
  rateLimit(ctx.req, "donate", 10);
  const data = await parseBody(ctx, donationCreateSchema);
  const stripe = stripeClient();
  if (!stripe) throw new ApiError(503, "Payments are not configured. Please try again later.");
  if (!(data.amount > 0)) throw new ApiError(400, "Invalid Stripe request");

  const db = getDb();
  const id = crypto.randomUUID();
  await db.insert(donations).values({
    id,
    amount: data.amount,
    currency: data.currency,
    donorName: data.donor_name ?? null,
    donorEmail: data.donor_email ?? null,
    message: data.message ?? null,
    isAnonymous: data.is_anonymous,
    paymentProvider: "stripe",
    status: "pending",
  });

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100),
      currency: data.currency.toLowerCase(),
      metadata: { donation_id: id },
      automatic_payment_methods: { enabled: true },
    });
    await db.update(donations).set({ paymentIntentId: intent.id }).where(eq(donations.id, id));
    return { client_secret: intent.client_secret, donation_id: id, amount: data.amount, currency: data.currency };
  } catch (e) {
    console.error(`[Stripe] PaymentIntent failed for donation ${id}`, e);
    if (e instanceof Stripe.errors.StripeAuthenticationError) throw new ApiError(401, "Stripe authentication failed");
    if (e instanceof Stripe.errors.StripeConnectionError) throw new ApiError(502, "Could not connect to Stripe");
    if (e instanceof Stripe.errors.StripeInvalidRequestError) throw new ApiError(400, "Invalid Stripe request");
    throw new ApiError(500, "Payment processing failed");
  }
});

// The ONLY place a donation becomes COMPLETED: Stripe-signed webhook.
route("POST", "/api/donations/webhook", async (ctx) => {
  const secret = env.stripeWebhookSecret;
  const stripe = stripeClient();
  if (!secret || !stripe) throw new ApiError(503, "Webhook not configured");

  const payload = await ctx.req.text();
  const sig = ctx.req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (e) {
    console.warn("[Stripe] Webhook signature verification failed", e);
    throw badRequest("Invalid signature");
  }

  const db = getDb();
  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const [d] = await db.select().from(donations).where(eq(donations.paymentIntentId, intent.id)).limit(1);
    if (!d) return { received: true };
    if (d.status !== "completed") {
      await db.update(donations).set({ status: "completed" }).where(eq(donations.id, d.id));
      ctx.after.push(() =>
        sendDonationNotificationEmail({
          donorName: d.donorName,
          donorEmail: d.donorEmail,
          amount: d.amount,
          currency: d.currency,
          isAnonymous: d.isAnonymous,
          message: d.message,
        }),
      );
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const [d] = await db.select().from(donations).where(eq(donations.paymentIntentId, intent.id)).limit(1);
    if (d && d.status === "pending") await db.update(donations).set({ status: "failed" }).where(eq(donations.id, d.id));
  }
  return { received: true };
});

route("GET", "/api/donations/status/:id", async (ctx) => {
  const id = uuidParam(ctx.params.id, "ID");
  const [d] = await getDb().select().from(donations).where(eq(donations.id, id)).limit(1);
  if (!d) throw notFound("Donation not found");
  return { id: d.id, status: d.status };
});

route("GET", "/api/donations/total", async () => {
  const [r] = await getDb()
    .select({ total: sql<number>`coalesce(sum(${donations.amount}), 0)` })
    .from(donations)
    .where(eq(donations.status, "completed"));
  return { total: Number(r?.total ?? 0) };
});

const donationResponse = (d: typeof donations.$inferSelect) => snakeRow(d, ["paymentIntentId"]);

route("GET", "/api/donations", async () => {
  const rows = await getDb()
    .select()
    .from(donations)
    .where(eq(donations.status, "completed"))
    .orderBy(desc(donations.createdAt))
    .limit(50);
  return rows.map(donationResponse);
});

route(
  "POST",
  "/api/donations/manual",
  async (ctx) => {
    await currentAdmin(ctx);
    const data = await parseBody(ctx, donationCreateSchema);
    const db = getDb();
    const id = crypto.randomUUID();
    await db.insert(donations).values({
      id,
      amount: data.amount,
      currency: data.currency,
      donorName: data.donor_name ?? null,
      donorEmail: data.donor_email ?? null,
      message: data.message ?? null,
      isAnonymous: data.is_anonymous,
      paymentProvider: "manual",
      status: "completed",
    });
    const [d] = await db.select().from(donations).where(eq(donations.id, id)).limit(1);
    ctx.after.push(() =>
      sendDonationNotificationEmail({
        donorName: d.donorName,
        donorEmail: d.donorEmail,
        amount: d.amount,
        currency: d.currency,
        isAnonymous: d.isAnonymous,
        message: d.message,
      }),
    );
    return donationResponse(d);
  },
  201,
);

export { donationResponse };

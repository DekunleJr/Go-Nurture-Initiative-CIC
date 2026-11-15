import { eq, sql } from "drizzle-orm";
import { getDb, schema } from "../db";
import { env } from "../env";
import {
  clearAuthCookie,
  createAccessToken,
  currentAdmin,
  currentPartner,
  facilitatorResponse,
  generateSetPasswordToken,
  hashPassword,
  partnerResponse,
  setAuthCookie,
  verifyPassword,
} from "../auth";
import { badRequest, forbidden, notFound, parseBody, route, unauthorized, uuidParam } from "../http";
import { rateLimit } from "../rateLimit";
import { sendInviteEmail, sendPasswordResetEmail } from "../email";
import {
  facilitatorCreateSchema,
  forgotPasswordSchema,
  loginSchema,
  partnerCreateSchema,
  setPasswordSchema,
} from "../validation";

const { partnerOrganisations: partners, facilitators } = schema;
const HOURS_48 = 48 * 3600 * 1000;
const inviteLink = (token: string, reset = false) =>
  `${env.siteUrl}/portal/set-password?token=${token}${reset ? "&reset=true" : ""}`;

route("POST", "/api/auth/forgot-password", async (ctx) => {
  rateLimit(ctx.req, "forgot", 5);
  const data = await parseBody(ctx, forgotPasswordSchema);
  const email = data.email.toLowerCase();
  const db = getDb();

  const [partner] = await db.select().from(partners).where(sql`lower(${partners.email}) = ${email}`).limit(1);
  if (partner) {
    const token = generateSetPasswordToken();
    await db
      .update(partners)
      .set({ setPasswordToken: token, setPasswordTokenExpires: new Date(Date.now() + HOURS_48) })
      .where(eq(partners.id, partner.id));
    ctx.after.push(() =>
      sendPasswordResetEmail({ to: partner.email, name: partner.contactName || "Partner", link: inviteLink(token, true) }),
    );
  }
  const [fac] = await db.select().from(facilitators).where(sql`lower(${facilitators.email}) = ${email}`).limit(1);
  if (fac) {
    const token = generateSetPasswordToken();
    await db
      .update(facilitators)
      .set({ setPasswordToken: token, setPasswordTokenExpires: new Date(Date.now() + HOURS_48) })
      .where(eq(facilitators.id, fac.id));
    ctx.after.push(() =>
      sendPasswordResetEmail({ to: fac.email, name: fac.name || "Facilitator", link: inviteLink(token, true) }),
    );
  }
  // Same answer whether or not the account exists (prevents enumeration).
  return { message: "If an account exists with that email, a password reset link has been sent." };
});

route("POST", "/api/auth/admin/create-partner", async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, partnerCreateSchema);
  const db = getDb();
  const [existing] = await db.select({ id: partners.id }).from(partners).where(eq(partners.email, data.email)).limit(1);
  if (existing) throw badRequest("A partner with this email already exists");

  const token = generateSetPasswordToken();
  const id = crypto.randomUUID();
  await db.insert(partners).values({
    id,
    organisationName: data.organisation_name,
    contactName: data.contact_name,
    email: data.email,
    phone: data.phone ?? null,
    organisationType: data.organisation_type,
    setPasswordToken: token,
    setPasswordTokenExpires: new Date(Date.now() + HOURS_48),
    isVerified: false,
  });
  const [partner] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  const link = inviteLink(token);
  ctx.after.push(() =>
    sendInviteEmail({
      to: partner.email,
      name: partner.contactName,
      organisationName: partner.organisationName,
      link,
    }),
  );
  return { message: `Invitation sent to ${partner.email}`, partner: partnerResponse(partner), invite_link: link };
});

route("POST", "/api/auth/admin/create-facilitator", async (ctx) => {
  await currentAdmin(ctx);
  const data = await parseBody(ctx, facilitatorCreateSchema);
  const db = getDb();
  const [existing] = await db.select({ id: facilitators.id }).from(facilitators).where(eq(facilitators.email, data.email)).limit(1);
  if (existing) throw badRequest("A facilitator with this email already exists");

  const token = generateSetPasswordToken();
  const id = crypto.randomUUID();
  await db.insert(facilitators).values({
    id,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    setPasswordToken: token,
    setPasswordTokenExpires: new Date(Date.now() + HOURS_48),
    isVerified: false,
  });
  const [fac] = await db.select().from(facilitators).where(eq(facilitators.id, id)).limit(1);
  const link = inviteLink(token);
  ctx.after.push(() =>
    sendInviteEmail({ to: fac.email, name: fac.name, organisationName: "Go Nurture Initiative CIC", link }),
  );
  return { message: `Invitation sent to ${fac.email}`, facilitator: facilitatorResponse(fac), invite_link: link };
});

route("POST", "/api/auth/admin/resend-invite/:partnerId", async (ctx) => {
  await currentAdmin(ctx);
  const id = uuidParam(ctx.params.partnerId, "partner ID");
  const db = getDb();
  const [partner] = await db.select().from(partners).where(eq(partners.id, id)).limit(1);
  if (!partner) throw notFound("Partner not found");
  if (partner.hashedPassword !== null) {
    throw badRequest("This partner has already activated their account. Use the password reset flow instead.");
  }
  const token = generateSetPasswordToken();
  await db
    .update(partners)
    .set({ setPasswordToken: token, setPasswordTokenExpires: new Date(Date.now() + HOURS_48) })
    .where(eq(partners.id, id));
  const link = inviteLink(token);
  ctx.after.push(() =>
    sendInviteEmail({
      to: partner.email,
      name: partner.contactName || "Partner",
      organisationName: partner.organisationName,
      link,
    }),
  );
  return { message: `Invitation resent to ${partner.email}`, invite_link: link };
});

route("POST", "/api/auth/set-password", async (ctx) => {
  rateLimit(ctx.req, "set-password", 5);
  const data = await parseBody(ctx, setPasswordSchema);
  const db = getDb();
  const expired = () => badRequest("This invitation link has expired. Please contact the administrator.");

  const [partner] = await db.select().from(partners).where(eq(partners.setPasswordToken, data.token)).limit(1);
  if (partner) {
    if (partner.setPasswordTokenExpires && partner.setPasswordTokenExpires < new Date()) throw expired();
    await db
      .update(partners)
      .set({
        hashedPassword: await hashPassword(data.password),
        setPasswordToken: null,
        setPasswordTokenExpires: null,
        isVerified: true,
      })
      .where(eq(partners.id, partner.id));
    const [fresh] = await db.select().from(partners).where(eq(partners.id, partner.id)).limit(1);
    const role = fresh.isAdmin ? "admin" : "partner";
    setAuthCookie(ctx, await createAccessToken(fresh.id, role));
    return { access_token: null, token_type: "bearer", role, partner: partnerResponse(fresh), facilitator: null };
  }

  const [fac] = await db.select().from(facilitators).where(eq(facilitators.setPasswordToken, data.token)).limit(1);
  if (fac) {
    if (fac.setPasswordTokenExpires && fac.setPasswordTokenExpires < new Date()) throw expired();
    await db
      .update(facilitators)
      .set({
        hashedPassword: await hashPassword(data.password),
        setPasswordToken: null,
        setPasswordTokenExpires: null,
        isVerified: true,
      })
      .where(eq(facilitators.id, fac.id));
    const [fresh] = await db.select().from(facilitators).where(eq(facilitators.id, fac.id)).limit(1);
    setAuthCookie(ctx, await createAccessToken(fresh.id, "facilitator"));
    return {
      access_token: null,
      token_type: "bearer",
      role: "facilitator",
      partner: null,
      facilitator: facilitatorResponse(fresh),
    };
  }
  throw badRequest("Invalid or expired invitation link");
});

route("POST", "/api/auth/login", async (ctx) => {
  rateLimit(ctx.req, "login", 5);
  const data = await parseBody(ctx, loginSchema);
  const db = getDb();
  const invalid = () => unauthorized("Invalid email or password");
  const notSet = () => unauthorized("You have not set your password yet. Please use the link sent to your email.");

  const [partner] = await db.select().from(partners).where(eq(partners.email, data.email)).limit(1);
  if (partner) {
    if (partner.hashedPassword === null) throw notSet();
    if (!(await verifyPassword(data.password, partner.hashedPassword))) throw invalid();
    if (!partner.isActive) throw forbidden("Account is deactivated");
    const role = partner.isAdmin ? "admin" : "partner";
    setAuthCookie(ctx, await createAccessToken(partner.id, role));
    return { access_token: null, token_type: "bearer", role, partner: partnerResponse(partner), facilitator: null };
  }

  const [fac] = await db.select().from(facilitators).where(eq(facilitators.email, data.email)).limit(1);
  if (fac) {
    if (fac.hashedPassword === null) throw notSet();
    if (!(await verifyPassword(data.password, fac.hashedPassword))) throw invalid();
    if (!fac.isActive) throw forbidden("Account is deactivated");
    setAuthCookie(ctx, await createAccessToken(fac.id, "facilitator"));
    return {
      access_token: null,
      token_type: "bearer",
      role: "facilitator",
      partner: null,
      facilitator: facilitatorResponse(fac),
    };
  }
  throw invalid();
});

route("POST", "/api/auth/logout", (ctx) => {
  clearAuthCookie(ctx);
  return { message: "Logged out" };
});

route("GET", "/api/auth/me", async (ctx) => partnerResponse(await currentPartner(ctx)));

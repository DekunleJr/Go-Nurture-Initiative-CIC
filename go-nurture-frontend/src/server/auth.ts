import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { getDb, schema } from "./db";
import { env } from "./env";
import { ApiError, forbidden, unauthorized, type Ctx } from "./http";

export const AUTH_COOKIE = "access_token";

export type Role = "partner" | "admin" | "facilitator";
export type Partner = typeof schema.partnerOrganisations.$inferSelect;
export type Facilitator = typeof schema.facilitators.$inferSelect;

export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
// passlib's "$2b$" hashes from the old Python backend verify fine with bcryptjs.
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
export const generateSetPasswordToken = () => randomBytes(48).toString("base64url");

const key = () => new TextEncoder().encode(env.secretKey);

export async function createAccessToken(userId: string, role: Role) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(`${env.tokenMinutes}m`)
    .sign(key());
}

function cookieFlags() {
  // Same-origin now (one Next.js app), so Lax is correct and sufficient.
  return `Path=/; HttpOnly; SameSite=Lax${env.isProduction ? "; Secure" : ""}`;
}

export function setAuthCookie(ctx: Ctx, token: string) {
  ctx.setCookies.push(`${AUTH_COOKIE}=${token}; Max-Age=${env.tokenMinutes * 60}; ${cookieFlags()}`);
}

export function clearAuthCookie(ctx: Ctx) {
  ctx.setCookies.push(`${AUTH_COOKIE}=; Max-Age=0; ${cookieFlags()}`);
}

function extractToken(req: Request): string | undefined {
  const authz = req.headers.get("authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) return authz.slice(7).trim();
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === AUTH_COOKIE) return v.join("=");
  }
  return undefined;
}

async function readToken(req: Request): Promise<{ sub: string; role: string }> {
  const token = extractToken(req);
  if (!token) throw unauthorized();
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (!payload.sub) throw unauthorized();
    return { sub: payload.sub, role: String(payload.role ?? "") };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw unauthorized();
  }
}

export async function currentPartner(ctx: Ctx): Promise<Partner> {
  const { sub, role } = await readToken(ctx.req);
  if (role !== "partner" && role !== "admin") throw unauthorized();
  const [partner] = await getDb()
    .select()
    .from(schema.partnerOrganisations)
    .where(eq(schema.partnerOrganisations.id, sub))
    .limit(1);
  if (!partner) throw unauthorized();
  return partner;
}

export async function currentAdmin(ctx: Ctx): Promise<Partner> {
  const partner = await currentPartner(ctx);
  if (!partner.isAdmin) throw forbidden("Admin access required");
  return partner;
}

export async function currentFacilitator(ctx: Ctx): Promise<Facilitator> {
  const { sub, role } = await readToken(ctx.req);
  if (role !== "facilitator") throw unauthorized();
  const [f] = await getDb().select().from(schema.facilitators).where(eq(schema.facilitators.id, sub)).limit(1);
  if (!f) throw unauthorized();
  return f;
}

// ---- response shapes (match the old Pydantic responses) ----
export const partnerResponse = (p: Partner) => ({
  id: p.id,
  organisation_name: p.organisationName,
  contact_name: p.contactName,
  email: p.email,
  phone: p.phone,
  organisation_type: p.organisationType,
  is_active: p.isActive,
  is_verified: p.isVerified,
  is_admin: p.isAdmin,
  created_at: p.createdAt,
});

export const facilitatorResponse = (f: Facilitator) => ({
  id: f.id,
  name: f.name,
  email: f.email,
  phone: f.phone,
  is_active: f.isActive,
  is_verified: f.isVerified,
  created_at: f.createdAt,
});

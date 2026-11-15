import path from "node:path";
import { eq, and, count } from "drizzle-orm";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb, schema } from "./db";
import { env } from "./env";
import { hashPassword } from "./auth";
import { DEFAULT_TEMPLATES } from "./email/defaultTemplates";

const { partnerOrganisations, communityPartners, emailTemplates } = schema;

const INITIAL_COMMUNITY_PARTNERS = [
  "NHS Norfolk & Waveney Integrated Care Board",
  "Community Midwives & Health Visitors",
  "English Plus (Language Support)",
  "Bridge Plus (Migrant Support)",
  "New Routes (Refugee Support)",
  "Local Churches & Community Groups",
  "Local Mosques & Faith Centres",
  "Family Support Services",
];

function validateProductionConfig() {
  if (!env.isProduction) return;
  const errors: string[] = [];
  if (env.secretKey.length < 32) errors.push("SECRET_KEY must be at least 32 characters in production");
  if (env.siteUrl.startsWith("http://localhost")) errors.push("NEXT_PUBLIC_SITE_URL must be the production URL");
  if (env.stripeSecretKey && !env.stripeWebhookSecret) {
    errors.push("STRIPE_WEBHOOK_SECRET must be set when STRIPE_SECRET_KEY is configured");
  }
  if (errors.length) throw new Error("Production configuration errors:\n- " + errors.join("\n- "));
}

async function seedAdmin() {
  if (!env.adminEmail || !env.adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seeding.");
    return;
  }
  const db = getDb();
  const [existing] = await db
    .select({ id: partnerOrganisations.id })
    .from(partnerOrganisations)
    .where(and(eq(partnerOrganisations.email, env.adminEmail), eq(partnerOrganisations.isAdmin, true)))
    .limit(1);
  if (existing) return;
  await db.insert(partnerOrganisations).values({
    organisationName: "Go Nurture Admin",
    contactName: "Administrator",
    email: env.adminEmail,
    hashedPassword: await hashPassword(env.adminPassword),
    organisationType: "admin",
    isActive: true,
    isVerified: true,
    isAdmin: true,
  });
  console.log(`Admin account created: ${env.adminEmail}`);
}

async function seedCommunityPartners() {
  const db = getDb();
  const [{ n }] = await db.select({ n: count() }).from(communityPartners);
  if (Number(n) > 0) return;
  await db.insert(communityPartners).values(INITIAL_COMMUNITY_PARTNERS.map((name) => ({ name })));
}

async function seedEmailTemplates() {
  const db = getDb();
  for (const t of DEFAULT_TEMPLATES) {
    const [exists] = await db
      .select({ id: emailTemplates.id })
      .from(emailTemplates)
      .where(eq(emailTemplates.templateKey, t.key))
      .limit(1);
    if (!exists) {
      await db
        .insert(emailTemplates)
        .values({ templateKey: t.key, name: t.name, subject: t.subject, body: t.body, version: 1, isActive: true });
    }
  }
}

/** Runs once when the server starts: validate config, migrate the schema, seed data. */
export async function startup() {
  validateProductionConfig();
  await migrate(getDb(), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("Database migrations applied");
  await seedAdmin();
  await seedCommunityPartners();
  await seedEmailTemplates();
}

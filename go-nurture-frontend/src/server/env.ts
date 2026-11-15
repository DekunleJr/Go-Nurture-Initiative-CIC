function opt(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

// Read lazily (getters) so `next build` never needs production secrets.
export const env = {
  get databaseUrl(): string {
    const v = opt("DATABASE_URL");
    if (!v) throw new Error("DATABASE_URL is not set");
    return v;
  },
  get secretKey(): string {
    const v = opt("SECRET_KEY");
    if (!v) throw new Error("SECRET_KEY is not set");
    return v;
  },
  get dbPoolSize(): number {
    return Number(opt("DB_POOL_SIZE") ?? 5);
  },
  get tokenMinutes(): number {
    return Number(opt("ACCESS_TOKEN_EXPIRE_MINUTES") ?? 60);
  },
  get isProduction(): boolean {
    return process.env.NODE_ENV === "production";
  },
  /** Public origin of the site, used to build invite / reset links. */
  get siteUrl(): string {
    return (opt("NEXT_PUBLIC_SITE_URL") ?? opt("FRONTEND_URL") ?? "http://localhost:3000").replace(/\/$/, "");
  },
  get resendApiKey() {
    return opt("RESEND_API_KEY");
  },
  get resendFrom(): string {
    return opt("RESEND_FROM_EMAIL") ?? "Go Nurture <noreply@gonurtureinitiative.org.uk>";
  },
  get contactEmail() {
    return opt("CONTACT_EMAIL");
  },
  get stripeSecretKey() {
    return opt("STRIPE_SECRET_KEY");
  },
  get stripeWebhookSecret() {
    return opt("STRIPE_WEBHOOK_SECRET");
  },
  get adminEmail() {
    return opt("ADMIN_EMAIL");
  },
  get adminPassword() {
    return opt("ADMIN_PASSWORD");
  },
  /** Optional secret letting a cPanel cron job drain the email queue. */
  get cronSecret() {
    return opt("CRON_SECRET");
  },
};

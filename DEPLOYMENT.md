# Deployment Guide (Krystal cPanel hosting, Next.js + MySQL)

The site is now a single Next.js application (`go-nurture-frontend`). The REST API that used to be
the Python/FastAPI backend lives inside it (`src/app/api/[...path]/route.ts` -> `src/server/`), and
data is stored in MySQL via Drizzle ORM. `go-nurture-backend/` is the retired Python service, kept
only as a reference for the port.

## What runs where

| Piece | Where |
|---|---|
| Pages + API | One Node.js process started by cPanel "Setup Node.js App" |
| Database | MySQL created in cPanel "MySQL Databases" |
| Schema | Applied automatically on every start from `drizzle/*.sql` (`src/instrumentation.ts`) |
| Seed data | Admin user, community partners and email templates are created on first start |

## 1. Create the database (cPanel)

1. cPanel > **MySQL Databases** > create a database (e.g. `gonurture`).
2. Create a user with a strong password, then **add the user to the database with ALL PRIVILEGES**.
3. Note the full names, which are prefixed with your account name: `account_gonurture`, `account_gnuser`.
4. `DATABASE_URL` is `mysql://account_gnuser:PASSWORD@localhost:3306/account_gonurture`
   (URL-encode special characters in the password, e.g. `@` -> `%40`).

## 2. Build the upload package (your PC)

1. In `go-nurture-frontend`, edit `.env.production.local` and set `NEXT_PUBLIC_SITE_URL` to your real
   `https://` domain. `NEXT_PUBLIC_API_URL` must stay `/`. Put `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   in `.env.local` or `.env.production.local` if you take donations.
   `NEXT_PUBLIC_*` values are baked in at build time, so changing them later needs a rebuild.
2. Run `npm ci` then `npm run package:cpanel`.
   It builds the app, refuses to continue if the old API URL is still baked in, and creates
   `deploy/` and `deploy.zip` (about 10 MB).

## 3. Create the Node.js app (cPanel)

1. cPanel > **Setup Node.js App** > **Create Application**.
   - Node.js version: **22** (minimum 20.9)
   - Application mode: **Production**
   - Application root: e.g. `gonurture` (a folder in your home directory, outside `public_html`)
   - Application URL: your domain
   - Application startup file: `app.js`
2. Upload `deploy.zip` to the application root with **File Manager** and **Extract** it
   (make sure hidden files such as `.next` are included).
3. Add **Environment variables** in the same page (see `go-nurture-frontend/.env.example`):
   `DATABASE_URL`, `SECRET_KEY` (32+ random chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `NEXT_PUBLIC_SITE_URL`, and as needed `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL`,
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`.
4. Click **Restart**. Open `https://<domain>/api/health` -> `{"status":"healthy"}`.
   The first start creates all tables. Check the app's log (`stderr.log` in the app root) for errors.
5. Log in at `/portal/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

Do not run `npm install` on the server: `node_modules` is already inside the package and has no
native modules.

## 4. Stripe and email

- Stripe webhook endpoint: `https://<domain>/api/donations/webhook`, events `payment_intent.succeeded` and
  `payment_intent.payment_failed`. Put the signing secret in `STRIPE_WEBHOOK_SECRET` and restart the app.
- Failed emails are retried from the admin dashboard, or automatically if you add a cPanel **Cron Job**
  every 10 minutes: `curl -s "https://<domain>/api/cron/email-queue?secret=YOUR_CRON_SECRET" > /dev/null`

## 5. Updating the site

Re-run `npm run package:cpanel`, upload and extract `deploy.zip` over the application root
(your environment variables stay in cPanel), then **Restart** the app. New migrations apply on start.

Schema changes: edit `src/server/db/schema.ts`, run `npm run db:generate`, commit the new `drizzle/*.sql` files.

## 6. Backups

cPanel > **Backup** (or JetBackup if offered) covers the MySQL database. Also download a manual
database export from **phpMyAdmin** before each release.

## Local development

1. Create a local MySQL database and copy `go-nurture-frontend/.env.example` to `.env.local`
   (set `DATABASE_URL`, `SECRET_KEY`, `NEXT_PUBLIC_API_URL=/`).
2. `npm install`, `npm run dev`. Migrations and seeding run when the dev server starts.

## Moving existing data from the old PostgreSQL database

The new schema keeps the same tables, columns and UUID ids. Export each table from Postgres as CSV
(or `INSERT` statements) and import into the matching MySQL table with phpMyAdmin, in this order:
`partner_organisations`, `facilitators`, `venues`, `cohorts`, `referrals`, `session_reviews`,
`contact_submissions`, `donations`, `email_logs`, `community_partners`, `email_templates`, `email_queue`.
Convert booleans to 1/0, enum `donations.status` to lowercase values, and JSON columns as JSON text.
Password hashes carry over unchanged (bcrypt).

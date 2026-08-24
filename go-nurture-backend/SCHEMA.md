# Database Schema

PostgreSQL schema managed by Alembic. Run `alembic upgrade head` from `go-nurture-backend` to apply migrations.

## Core tables

| Table | Purpose | Key relationships |
|---|---|---|
| `partner_organisations` | Partner and administrator accounts | Owns referrals |
| `referrals` | Mother referrals submitted by partners | References partner and optional program cohorts |
| `cohorts` | Birth Confidence and Breastfeeding Clinic cohorts | References an optional venue and facilitator |
| `cohort_members` | Cohort membership records where present in the deployed schema | Links mothers to cohorts |
| `venues` | Class locations and accessibility details | Referenced by cohorts |
| `facilitators` | Facilitator accounts | Assigned to cohorts; owns session reviews |
| `session_reviews` | Facilitator delivery audits | References cohorts and facilitators |
| `community_partners` | Public community-support organisations | Independently managed by administrators |
| `donations` | Donation and payment records | Public donation workflow |
| `contact_submissions` | Public contact form submissions | Notification email logging |
| `email_logs` | Delivery attempts and failures | Stores recipient, type, status, and error details |

## Migration history

Migrations are applied in one linear history ending at merge revision `f7a8b9c0d1e2`:

- `ae4c8b2e7629`: initial schema
- `a7b8c9d0e1f2`: facilitators and cohort assignment
- `b8c9d0e1f2a3`: session reviews
- `cbf1c50a050e`: venue city and capacity
- `d4e5f6a7b8c9`: community partners
- `e5f6a7b8c9d0`: referral and cohort types
- `f6a7b8c9d0e1`: clinic cohort referral assignment
- `81c25c91c2a7`, `6234b8e0d825`: email logs
- `f7a8b9c0d1e2`: query indexes and migration-head merge

## Indexes

The final migration adds indexes for common referral, cohort, facilitator, session-review, status, and community-partner lookups. Index changes are reversible through `alembic downgrade`.

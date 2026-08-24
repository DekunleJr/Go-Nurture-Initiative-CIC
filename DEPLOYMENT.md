# Deployment Guide

## Components

- Frontend: Next.js application in `go-nurture-frontend`
- Backend: FastAPI application in `go-nurture-backend`
- Database: PostgreSQL with Alembic migrations

## Required configuration

Backend variables are documented in [go-nurture-backend/.env.example](go-nurture-backend/.env.example). At minimum, production requires:

- `DATABASE_URL`
- `SECRET_KEY` with at least 32 random characters
- `FRONTEND_URL` set to the deployed frontend origin
- `ENVIRONMENT=production`
- `DEBUG=False`

Frontend variables are documented in [go-nurture-frontend/.env.example](go-nurture-frontend/.env.example). Set `NEXT_PUBLIC_API_URL` to the API origin, or `/` when the API is reverse-proxied on the same origin.

Keep secrets in the hosting provider's secret manager. Do not commit `.env` or `.env.local` files.

## Backend deployment

The backend Docker image runs migrations before starting the API:

```powershell
docker build -t go-nurture-backend ./go-nurture-backend
docker run --env-file ./go-nurture-backend/.env -e PORT=8000 -p 8000:8000 go-nurture-backend
```

For a managed deployment, configure the service start command to provide the platform `PORT` value and ensure the database is reachable before startup.

## Frontend deployment

```powershell
cd go-nurture-frontend
npm ci
npm run build
npm start
```

The frontend build must receive its `NEXT_PUBLIC_*` variables at build time.

## Release checklist

1. Back up the production database.
2. Deploy the backend image to staging.
3. Run `alembic upgrade head` against staging and verify the API health endpoint.
4. Verify login, referral submission, admin CRUD, facilitator reviews, contact submission, and donations.
5. Promote the tested image and frontend build.
6. Check `/api/health`, application logs, and error tracking.
7. Keep the previous application version available for rollback.

## Rollback

Application rollback can use the previous image/build. Database migrations must be assessed individually before downgrading; prefer a forward corrective migration for production data changes. The Phase 4 index migration is reversible with `alembic downgrade <previous-revision>` after confirming the target revision and maintenance window.

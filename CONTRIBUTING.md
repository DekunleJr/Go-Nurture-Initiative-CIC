# Contributing

## Project layout

- `go-nurture-frontend`: Next.js frontend
- `go-nurture-backend`: FastAPI backend and Alembic migrations

## Development workflow

1. Create a focused branch from the current main branch.
2. Keep frontend and backend changes scoped to the behavior being changed.
3. Update Pydantic schemas when changing API payloads.
4. Use the shared frontend API client for internal HTTP requests.
5. Add an Alembic migration for database changes; do not edit an applied migration.
6. Run the relevant checks before opening a pull request.

## Checks

Frontend:

```powershell
cd go-nurture-frontend
npm run lint
npx tsc --noEmit
```

Backend:

```powershell
cd go-nurture-backend
python -m compileall -q app alembic/versions
alembic heads
```

## API changes

Prefer additive changes for production compatibility. Preserve existing response fields when introducing structured errors or pagination. Document new environment variables in `.env.example` files.

## Security

Never commit credentials, tokens, real database URLs, or production `.env` files. Authentication and authorization changes require explicit review and staging verification.

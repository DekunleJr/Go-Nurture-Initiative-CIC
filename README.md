# Go Nurture Initiative CIC

Go Nurture is a perinatal education and community-support platform with a Next.js frontend and FastAPI backend.

## Applications

- [Frontend](go-nurture-frontend/README.md): public site, partner portal, facilitator portal, and admin dashboard
- [Backend](go-nurture-backend/README.md): API, authentication, email services, and database migrations

## Quick start

1. Set up PostgreSQL and copy [go-nurture-backend/.env.example](go-nurture-backend/.env.example) to `.env`.
2. Follow the backend setup in [go-nurture-backend/README.md](go-nurture-backend/README.md).
3. Copy [go-nurture-frontend/.env.example](go-nurture-frontend/.env.example) to `.env.local`.
4. Run `npm install` and `npm run dev` from `go-nurture-frontend`.

The local API runs at `http://localhost:8000` and the frontend at `http://localhost:3000`.

## Documentation

- [Deployment guide](DEPLOYMENT.md)
- [Database schema](go-nurture-backend/SCHEMA.md)
- [Contributing](CONTRIBUTING.md)
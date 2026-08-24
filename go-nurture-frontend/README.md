# Go Nurture Frontend

Next.js frontend for the Go Nurture public site, partner portal, facilitator portal, and admin dashboard.

## Local setup

From this directory:

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

The development site is available at `http://localhost:3000`.

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend origin. Use `/` when the API is reverse-proxied on the same origin, or `http://localhost:8000` for a separate local API.

## Commands

```powershell
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Structure

- `src/app/`: App Router pages and portal workflows
- `src/components/`: shared UI and page components
- `src/lib/api-client.ts`: centralized internal API client
- `src/lib/auth-client.ts`: browser authentication storage boundary
- `src/types/`: shared API types
- `public/`: static assets and fonts

See the repository [deployment guide](../DEPLOYMENT.md) for production configuration.

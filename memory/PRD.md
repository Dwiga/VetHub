# VetCare Pro — Migration PRD

## Original problem statement
> Can we migrate this pnpm express-react to tanstack-react with bun, please?
> Also migrate drizzle to prisma.

## User decisions (2026-01)
- **Target framework**: TanStack Start (full-stack React).
- **Scope**: Full rewrite — collapse the pnpm monorepo into a single TanStack
  Start app.
- **Database**: Prisma with local **SQLite** (`file:./dev.db`) for now so things
  work without external infra. PostgreSQL can be swapped later by editing
  `provider` in `prisma/schema.prisma` and `DATABASE_URL`.
- **Auth**: Keep **Clerk**. Placeholder keys in `.env` until the user supplies
  real ones — UI gracefully degrades.
- **First iteration**: Get the toolchain green end-to-end with a handful of
  representative routes/pages ported.

## Architecture
```
Emergent ingress
  ├── /        → port 3000 (TanStack Start, bun, Vite) — UI + file-based router
  └── /api/*   → port 8001 (FastAPI proxy, /app/backend/server.py)
                   ↳ forwards to http://127.0.0.1:3000/api/*
                     (the same TanStack Start ServerRoute handlers)
```

The FastAPI proxy exists purely to satisfy the pod's pinned supervisor topology
(`backend` is hard-pinned to `uvicorn server:app` on 8001). It strips hop-by-hop
headers, forwards Authorization + cookies + body + query, and re-emits the
upstream status verbatim. In production this responsibility would belong to
nginx/Caddy and the proxy could be deleted.

## Tech stack
- **Runtime/PM**: bun 1.3 (`/usr/local/bin/bun`)
- **Framework**: TanStack Start ^1.95, TanStack Router file-based routing,
  TanStack Query
- **UI**: shadcn/ui (all 55 components ported verbatim), Tailwind v4, Lucide
  icons, Plus Jakarta Sans
- **ORM**: Prisma 6 → SQLite
- **Auth**: Clerk (`@clerk/clerk-react` + `@clerk/backend` JWT verification)
- **Proxy**: FastAPI + httpx

## What is implemented (2026-01)
### Backend (TanStack Start ServerRoutes)
- `GET /api/health` — service heartbeat
- `GET /api/species` — list of pet species (8 seeded)
- `GET /api/users/me` — current user (`getOrCreateLocalUser` from Clerk JWT)
- `POST /api/users/me/register-pet-owner` — flips `isPetOwner=true`
- `GET /api/pets` — current user's pets (with species)
- `GET /api/pets/:petId` — single pet (owner-scoped)
- `GET /api/visits?status=active` — visits scoped to the user's clinic (vet) or
  the user's pets (owner)

### Frontend pages
- `/` — Landing (full faithful port, i18n EN/ID, all CTAs, gradient hero)
- `/sign-in/*` — Clerk `<SignIn>` (or "Clerk not configured" notice)
- `/sign-up/*` — Clerk `<SignUp>` (or notice)
- `/dashboard` — Pet-owner cards + role selector + vet stub (auth-gated)
- `/pets` — Pet list (auth-gated)
- `/pets/:petId` — Pet detail card (auth-gated)

### Shared
- AppShell (bottom nav + role switcher) ported to TanStack Router `Link` +
  `useRouterState`
- PageHeader / StatusBadge ported
- LangContext (EN/ID) + RoleContext (pet-owner / vet) with SSR-safe localStorage
  hydration
- shadcn/ui (`/components/ui/*`) — 55 components copied verbatim (Radix-based,
  framework-agnostic)
- `lib/auth.ts` — Clerk hook shim that returns inert stubs when keys are
  placeholders (lets dev see UI without real keys)

### Data
- Prisma schema covers **all** Drizzle tables: User, Admin, Clinic, Staff,
  Species, Pet, Monitoring, Vaccination, Visit, VisitItem, DailyReport, Product,
  HotelBooking, HotelDailyLog, HealthEvent.
- Seed: 8 species (Dog/Cat/Rabbit/Bird/Hamster/Fish/Reptile/Other).

## Verification (iteration 1)
Testing subagent — **20/20 backend tests passed** (`/app/test_reports/iteration_1.json`):
- supervisor: both services RUNNING
- proxy forwarding parity (8001 ↔ 3000)
- public endpoints return 200 with valid JSON
- protected endpoints return 401 without auth and with fake Bearer
- preview URL parity verified
- landing HTML contains expected testids

## Prioritized backlog
### P0 — unblock real users
1. **Real Clerk keys** — paste `pk_test_…` / `sk_test_…` into
   `/app/frontend/.env` and `sudo supervisorctl restart frontend`.

### P1 — port remaining pages
1. `/vet` — vet dashboard (search by phone, active visits, create-visit form)
2. `/clinic` — clinic management (staff, products, settings)
3. `/visits/:visitId` — visit detail (anamnesis, therapy, daily reports, billing)
4. `/pets/:petId` enrichments — vaccinations, monitoring charts, health events
5. `/hotel` — hotel boarding bookings
6. `/admin` — platform admin
7. `/settings` — profile, language, role management
8. Reports / analytics endpoints

### P2 — polish & migration cleanup
1. Move `@app.on_event` → FastAPI `lifespan` context (cosmetic; testing agent nit)
2. Delete `/app/_legacy/` once all ports are validated
3. Swap SQLite → Postgres (just change provider + `DATABASE_URL`)
4. Optional: drop the FastAPI proxy and run TanStack Start directly on 8001
   when the supervisor config can be customised

## Personas
- **Pet owner** — registers pets, tracks vaccinations & health, reads visit history
- **Veterinarian** (clinic staff) — searches patients, creates inpatient /
  outpatient visits, logs daily reports
- **Vet clinic owner** — manages clinic, staff, products, revenue analytics
- **Hotel owner** — manages boarding bookings and daily logs
- **Platform admin** — moderates approvals (vet onboarding)

## Next tasks
1. User to supply real Clerk keys.
2. Port `/vet` and `/clinic` (largest unblocked surface area).
3. Add Prisma seed for an example clinic + staff + admin + a sample pet/visit so
   the dev experience after sign-up is non-empty.

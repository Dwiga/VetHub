# VetCare Pro

A full-stack veterinary clinic and pet management web app for Indonesia. Connects pet owners, veterinarians, and clinic owners in one platform — with mobile-optimized UI and bilingual support (Indonesian / English).

**5% of revenue from this app goes to street animal rescue organizations across Indonesia.**

> **Migration note (Jan 2026)** — This repo was migrated from pnpm + Express + React + Drizzle to **TanStack Start + Bun + Prisma**. The Express API server and the standalone React+Vite frontend have been collapsed into a single TanStack Start app. The legacy monorepo is preserved under `_legacy/` for reference and will be removed once the remaining pages are ported.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Migration Status](#migration-status)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **TanStack Start** (full-stack React) + TanStack Router (file-based routing) + TanStack Query |
| UI | React 19, Tailwind v4, shadcn/ui, Lucide icons, Plus Jakarta Sans |
| Backend | TanStack Start ServerRoutes (file-based `/api/*` handlers) |
| Database | **Prisma 6** + **SQLite** (dev) — swap `provider` to `postgresql` for prod |
| Auth | Clerk (`@clerk/clerk-react` + `@clerk/backend` JWT verification) |
| Runtime / Package manager | **Bun 1.3** |
| Reverse proxy (in this pod) | FastAPI (Python) — see [Architecture](#architecture) |

---

## Prerequisites

- **Bun 1.3+** — [bun.sh](https://bun.sh) (`curl -fsSL https://bun.sh/install | bash`)
- **Clerk account** — [clerk.com](https://clerk.com) (free tier works for dev)
- *(optional)* **Python 3.11+** — only if you want to run the FastAPI ingress proxy locally

> No PostgreSQL is required for dev. SQLite is created automatically at `frontend/prisma/dev.db`.

---

## Local Development

### 1. Install dependencies

```bash
cd frontend
bun install
```

### 2. Set up environment variables

```bash
cp .env.example .env   # or create one — see "Environment Variables" below
```

Fill in your Clerk keys (publishable + secret). A SQLite `DATABASE_URL=file:./dev.db` is fine for dev.

### 3. Create + seed the database

```bash
cd frontend
bun run prisma:push    # creates prisma/dev.db from schema.prisma
bun run prisma:seed    # inserts 8 default species
```

### 4. Start the dev server

```bash
cd frontend
bun run dev            # TanStack Start on http://localhost:3000
```

That's it — the same process serves the React UI **and** the `/api/*` endpoints. Open `http://localhost:3000` and you're up.

### 5. (Optional) Run the FastAPI ingress proxy

Only needed if you're mimicking the Emergent pod layout (UI on :3000, `/api/*` ingress pinned to :8001):

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

---

## Environment Variables

Set these in `frontend/.env` (Vite picks them up automatically; the `VITE_*` ones are exposed to the browser).

| Variable | Required | Scope | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | server | Prisma connection string. Dev default: `file:./dev.db`. Prod: `postgresql://…` |
| `CLERK_PUBLISHABLE_KEY` | Yes | server | Clerk publishable key (`pk_test_…` or `pk_live_…`) |
| `CLERK_SECRET_KEY` | Yes | server | Clerk secret key (`sk_test_…` or `sk_live_…`) — used to verify session JWTs server-side |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | client | Same publishable key — exposed to the browser bundle |
| `VITE_APP_URL` | No | client | Public app URL — used for sign-in/sign-up redirect targets |

For the FastAPI proxy (`backend/.env`):

| Variable | Required | Description |
|---|---|---|
| `FRONTEND_INTERNAL_URL` | No (defaults to `http://127.0.0.1:3000`) | Where the TanStack Start app is reachable |

> **Clerk keys** — sign in at [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys → copy the publishable + secret keys for your application.

---

## Available Scripts

All scripts live in `frontend/package.json` and assume you're in `/frontend`.

```bash
bun run dev              # Vite + TanStack Start dev server on :3000
bun run build            # production build
bun run preview          # preview the production build
bun run prisma:generate  # regenerate the Prisma client after schema changes
bun run prisma:push      # push schema.prisma → DB (dev workflow, no migrations)
bun run prisma:seed      # idempotent seed (species)
```

Yarn aliases (used by the Emergent supervisor): `yarn start` → `bun run dev`.

---

## Architecture

### One TanStack Start app

`frontend/` is a single TanStack Start application. File-based routing under `src/routes/`:

- Pages (`src/routes/index.tsx`, `src/routes/dashboard.tsx`, `src/routes/pets/$petId.tsx`, …) are React components rendered both server-side (SSR) and client-side.
- API handlers (`src/routes/api/health.ts`, `src/routes/api/pets.ts`, …) are TanStack Start `ServerRoute`s — pure server-side request/response handlers, reached at `/api/*`.

```
Browser
   │
   ├─ /              → src/routes/index.tsx           (landing)
   ├─ /dashboard     → src/routes/dashboard.tsx       (auth-gated UI)
   ├─ /pets          → src/routes/pets/index.tsx
   ├─ /pets/:petId   → src/routes/pets/$petId.tsx
   ├─ /sign-in/*     → src/routes/sign-in.$.tsx       (Clerk)
   ├─ /sign-up/*     → src/routes/sign-up.$.tsx       (Clerk)
   │
   ├─ /api/health           → src/routes/api/health.ts
   ├─ /api/species          → src/routes/api/species.ts
   ├─ /api/users/me         → src/routes/api/users.me.ts
   ├─ /api/users/me/register-pet-owner → …users.me.register-pet-owner.ts
   ├─ /api/pets             → src/routes/api/pets.ts
   ├─ /api/pets/:petId      → src/routes/api/pets.$petId.ts
   └─ /api/visits           → src/routes/api/visits.ts
```

### Why a FastAPI proxy?

In the Emergent preview pod the ingress pins `/api/*` to port **8001** and everything else to port **3000**. Since TanStack Start serves both UI and API on a single port, we run a tiny FastAPI proxy on `:8001` that forwards `/api/*` → `http://127.0.0.1:3000/api/*`. It strips hop-by-hop headers and faithfully forwards method, body, query, cookies, and `Authorization` headers. In any other deployment (your laptop, a single Docker image, Vercel, etc.) the proxy is unnecessary — just run the TanStack Start app on one port and you're done.

### Auth flow

1. Browser hits `/sign-in/*` → Clerk `<SignIn>` widget collects credentials.
2. Clerk issues a session JWT, stored as the `__session` cookie.
3. Authenticated client requests carry the JWT as `Authorization: Bearer <token>` (added by `useAuthedFetch` in `src/lib/api-client.ts`).
4. Server-side, `getAuthUserId(request)` in `src/lib/clerk-server.ts` calls `verifyToken` from `@clerk/backend` to validate the JWT against Clerk's JWKS.
5. `getOrCreateLocalUser` looks up the matching local `User` row (creating one from the Clerk profile on first login).

### Data layer

- Single Prisma schema at `frontend/prisma/schema.prisma` — covers every Drizzle table from the original codebase (User, Admin, Clinic, Staff, Species, Pet, Monitoring, Vaccination, Visit, VisitItem, DailyReport, Product, HotelBooking, HotelDailyLog, HealthEvent).
- Prisma client is a singleton (`src/lib/db.ts`) reused across HMR reloads.
- Money / decimal values are stored as `String` to preserve arbitrary precision under SQLite.

---

## Project Structure

```
.
├── frontend/                          # TanStack Start app (UI + API)
│   ├── prisma/
│   │   ├── schema.prisma              # Prisma schema (SQLite by default)
│   │   ├── seed.ts                    # idempotent seed (species)
│   │   └── dev.db                     # generated SQLite database
│   ├── public/
│   ├── src/
│   │   ├── routes/                    # file-based routing
│   │   │   ├── __root.tsx             # root layout (Clerk + Query + Lang + Role)
│   │   │   ├── index.tsx              # landing
│   │   │   ├── sign-in.$.tsx          # Clerk catch-all
│   │   │   ├── sign-up.$.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── pets/
│   │   │   │   ├── index.tsx
│   │   │   │   └── $petId.tsx
│   │   │   └── api/                   # ServerRoute handlers
│   │   │       ├── health.ts
│   │   │       ├── species.ts
│   │   │       ├── users.me.ts
│   │   │       ├── users.me.register-pet-owner.ts
│   │   │       ├── pets.ts
│   │   │       ├── pets.$petId.ts
│   │   │       └── visits.ts
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui (55 components)
│   │   │   ├── layout/AppShell.tsx    # bottom nav + role switcher
│   │   │   └── shared/                # PageHeader, StatusBadge
│   │   ├── contexts/                  # LangContext (EN/ID), RoleContext
│   │   ├── hooks/                     # use-toast, use-mobile
│   │   ├── i18n/                      # en.ts, id.ts
│   │   ├── lib/
│   │   │   ├── db.ts                  # Prisma client singleton
│   │   │   ├── clerk-server.ts        # JWT verification + getOrCreateLocalUser
│   │   │   ├── auth.ts                # Clerk hook shim (graceful degradation)
│   │   │   ├── api-client.ts          # TanStack Query hooks (useGetMe, useListMyPets, …)
│   │   │   ├── utils.ts               # cn() helper
│   │   │   └── phone.ts
│   │   ├── globals.css                # Tailwind v4 + theme tokens
│   │   ├── router.tsx                 # createRouter + QueryClient
│   │   └── routeTree.gen.ts           # auto-generated by TanStack Router
│   ├── vite.config.ts                 # tanstackStart() + viteReact() + tailwindcss()
│   ├── tsconfig.json
│   ├── package.json
│   └── .env
├── backend/                           # FastAPI ingress proxy (only needed on the Emergent pod)
│   ├── server.py                      # forwards /api/* → 127.0.0.1:3000
│   ├── requirements.txt
│   └── .env
├── memory/
│   ├── PRD.md                         # product requirements + migration roadmap
│   └── test_credentials.md            # Clerk + test-account notes
├── _legacy/                           # archived pnpm/Express/Drizzle codebase
└── README.md
```

---

## Migration Status

**First iteration (✅ done — 20/20 backend tests passing):**
- Toolchain green: bun + TanStack Start + Tailwind v4 + Prisma SQLite + Clerk
- Ported pages: landing (EN/ID), sign-in, sign-up, dashboard, /pets, /pets/:petId
- Ported API: `/api/health`, `/api/species`, `/api/users/me`, `/api/users/me/register-pet-owner`, `/api/pets`, `/api/pets/:petId`, `/api/visits`
- Prisma schema covers **every** Drizzle table (so subsequent ports don't touch the schema)

**Next iterations (see `memory/PRD.md`):**
- `/vet`, `/clinic`, `/visits/:visitId` (largest unblocked surface area)
- Enrich `/pets/:petId` with vaccinations, monitoring charts, health events
- `/hotel`, `/admin`, `/settings`, reports/analytics
- Swap SQLite → PostgreSQL for production
- Drop the FastAPI proxy and run TanStack Start directly on the ingress port outside the Emergent pod
- Delete `_legacy/` once every page is ported

---

## License

Proprietary — VetCare Pro / PetHub.

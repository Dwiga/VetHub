# VetHub — AI Project Context

> **For AI agents**: Read this file at the start of every session. When you add, remove, rename, or significantly change anything (files, features, APIs, conventions, dependencies), update the relevant sections below AND add a concise entry to the Changelog with the date. This file is the project's memory.

---

## Project Identity

**VetCare Pro / PetHub** — Full-stack veterinary clinic & pet management web app for Indonesia. Connects pet owners, veterinarians, clinic owners, and hotel owners in one bilingual (EN/ID) platform. Mobile-optimized. 5% of revenue donated to street animal rescue.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **TanStack Start** (React SSR + API on one port) |
| Router | TanStack Router (file-based, auto-generated route tree) |
| Data | TanStack Query (React Query v5) |
| UI | React 19, Tailwind CSS v4, shadcn/ui, Lucide icons, Recharts |
| Forms | react-hook-form + zod |
| ORM | Prisma 7.8 (dynamic adapter: SQLite for dev, PostgreSQL for prod) |
| Auth | Clerk (`@clerk/clerk-react` client + `@clerk/backend` server JWT verify) |
| Runtime | Bun 1.3 |
| Language | TypeScript 5.9 (strict) |
| Proxy | FastAPI (Python) — Emergent pod only, forwards `/api/*` :8001 → :3000 |
| Deployment | Docker Compose (nginx + Bun + PostgreSQL), or bare-metal systemd + Caddy |

---

## Architecture

Single TanStack Start app in `frontend/`. File-based routing handles both React pages (SSR) and API endpoints (ServerRoute handlers) on one port (3000).

### Entry Points

| Path | Handler | Purpose |
|---|---|---|
| `frontend/server.ts` | Bun.serve | Production: static assets + SSR + /api |
| `frontend/vite.config.ts` | Vite dev server | Dev: HMR on :3000 |
| `frontend/src/routes/__root.tsx` | Root layout | Clerk + QueryClient + LangContext + RoleContext |

### Auth Flow

1. `/sign-in/*` → Clerk `<SignIn>` widget
2. Clerk JWT stored as `__session` cookie
3. Client: `Authorization: Bearer <token>` via `useAuthedFetch` (`src/lib/api-client.ts`)
4. Server: `getAuthUserId(request)` in `src/lib/clerk-server.ts` → `verifyToken` from `@clerk/backend`
5. `getOrCreateLocalUser` creates/returns local `User` row from Clerk profile

### Database

- **Schema**: `frontend/prisma/schema.prisma` (PostgreSQL provider, SQLite-compatible)
- **Client**: `src/lib/db.ts` — singleton Prisma client, auto-selects adapter based on `DATABASE_URL`:
  - `file:` → `PrismaLibSql` (SQLite)
  - `postgresql://` → `PrismaPg`
- **14 models**: User, Admin, Clinic, Staff, Species, Pet, Vaccination, Visit, DailyReport, Product, HotelBooking, HotelDailyLog, HealthEvent, Monitoring
- **Seed**: `prisma/seed.ts` — idempotent, 8 species (Dog, Cat, Rabbit, Bird, Hamster, Fish, Reptile, Other)

### Data Layer Pattern

API handlers use `createAPIRoute` helper in `api-client.ts`:
- Authenticated routes wrap with `requireAuth` → calls `getAuthUserId`
- Prisma queries use `prisma.model.findMany/create/update/delete`
- Responses return plain JSON (no serialization layer)

---

## Directory Structure

```
VetHub/
├── CLAUDE.md                    ← THIS FILE — AI context & changelog
├── AGENTS.md                    ← Multica runtime (auto-managed, do not edit)
├── README.md                    ← Human-facing project docs
├── frontend/                    ← Main application
│   ├── src/
│   │   ├── routes/              ← File-based routing (pages + API)
│   │   │   ├── __root.tsx       ← Root layout
│   │   │   ├── index.tsx        ← Landing page
│   │   │   ├── dashboard.tsx
│   │   │   ├── admin.tsx
│   │   │   ├── settings.tsx
│   │   │   ├── sign-in.$.tsx / sign-up.$.tsx  ← Clerk auth
│   │   │   ├── pets/            ← Pet pages (index, $petId)
│   │   │   ├── onboarding/      ← Role registration flow
│   │   │   ├── vet.*.tsx        ← Vet dashboard + workflows
│   │   │   ├── clinic.*.tsx     ← Clinic management
│   │   │   ├── hotel.*.tsx      ← Hotel management
│   │   │   ├── share.*.tsx      ← Public share links
│   │   │   └── api/             ← 42 ServerRoute handlers
│   │   │       ├── health.ts, species.ts
│   │   │       ├── users.me.ts, users.me.register-pet-owner.ts
│   │   │       ├── users.register-for-vet.ts, users.register-for-hotel.ts
│   │   │       ├── users.phone-check.ts
│   │   │       ├── pets.ts, pets.$petId.ts
│   │   │       ├── pets.$petId.vaccinations.ts, pets.$petId.health-events.ts
│   │   │       ├── pets.$petId.monitoring.ts
│   │   │       ├── visits.ts, visits.$visitId.ts
│   │   │       ├── visits.$visitId.daily-reports.ts, visits.$visitId.share.ts
│   │   │       ├── daily-reports.$reportId.ts
│   │   │       ├── clinic.mine.ts, clinic.$clinicId.ts
│   │   │       ├── clinic.$clinicId.staff.ts, clinic.$clinicId.products.ts
│   │   │       ├── clinic.$clinicId.reports.stats.ts, .summary.ts
│   │   │       ├── hotel-bookings.ts, hotel-bookings.$bookingId.ts
│   │   │       ├── hotel-bookings.$bookingId.daily-logs.ts
│   │   │       ├── hotel.$bookingId.ts, hotel.$bookingId.logs.ts, .share.ts
│   │   │       ├── hotel.$hotelId.reports.summary.ts
│   │   │       ├── hotel.standalone.ts, hotel.clinic.$clinicId.bookings.ts
│   │   │       ├── products.$productId.ts
│   │   │       ├── search.owner.ts, search.pet.ts
│   │   │       └── share.hotel.$token.ts, share.vet.$token.ts
│   │   ├── components/
│   │   │   ├── ui/              ← 55 shadcn/ui components
│   │   │   ├── layout/AppShell.tsx  ← Bottom nav + role switcher
│   │   │   └── shared/          ← PageHeader, StatusBadge, OwnerSearch, etc.
│   │   ├── contexts/            ← LangContext (EN/ID), RoleContext
│   │   ├── i18n/                ← en.ts, id.ts
│   │   ├── hooks/               ← use-toast, use-mobile
│   │   └── lib/
│   │       ├── db.ts            ← Prisma client singleton (dynamic adapter)
│   │       ├── clerk-server.ts  ← JWT verify + getOrCreateLocalUser
│   │       ├── auth.ts          ← Clerk hook shim
│   │       ├── api-client.ts    ← TanStack Query hooks + createAPIRoute + useAuthedFetch
│   │       ├── utils.ts         ← cn() helper (clsx + tailwind-merge)
│   │       └── phone.ts         ← Phone formatting utilities
│   ├── prisma/
│   │   ├── schema.prisma        ← Main schema (PostgreSQL)
│   │   ├── schema.sqlite.prisma  ← SQLite variant
│   │   ├── schema.postgresql.prisma ← PostgreSQL variant
│   │   ├── seed.ts              ← Idempotent seed
│   │   └── migrations/          ← Prisma migrations
│   ├── server.ts                ← Production Bun entry
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/                     ← FastAPI proxy (Emergent pod only)
├── nginx/                       ← nginx reverse proxy config
├── deployment/                  ← Prod deploy (Caddy, systemd, scripts)
├── memory/                      ← Product docs (PRD.md, test_credentials.md)
├── _legacy/                     ← Archived pnpm/Express/Drizzle codebase
├── Dockerfile                   ← Multi-stage Bun production image
├── docker-compose.yml           ← Prod: nginx + app + PostgreSQL
├── docker-compose.dev.yml       ← Dev: PostgreSQL only
└── .github/workflows/deploy.yml ← CI/CD pipeline
```

---

## Key Conventions

### Code Patterns
- **API handlers**: Each file in `src/routes/api/` exports a single ServerRoute. Use `createAPIRoute` helper for auth-wrapped handlers. File name matches URL path (dots = slashes, `$param` = path param).
- **TanStack Query hooks**: Defined in `src/lib/api-client.ts`. Server-side prefetch in route `loader` functions, client-side `useQuery`/`useMutation` in components.
- **Forms**: `react-hook-form` + `zod` validation. Use `useForm` with `zodResolver`.
- **Styling**: Tailwind v4 utility classes + `cn()` (clsx + tailwind-merge) for conditional classes. shadcn/ui components from `src/components/ui/`.
- **i18n**: `useLang()` from `LangContext`. Translation keys in `src/i18n/en.ts` and `id.ts`. Fallback to EN.
- **Auth gating**: Use `useAuth()` from Clerk. Server-side auth via `getAuthUserId()`.
- **Phone numbers**: Format through `src/lib/phone.ts` utilities.

### File Naming
- **Route files**: Flat or nested under `src/routes/`. Flat `$param` files use dot notation (e.g., `pets.$petId.ts` for `/api/pets/:petId`).
- **Components**: PascalCase `.tsx` in `src/components/`.
- **API handlers**: camelCase `.ts` in `src/routes/api/`.

### Dev Workflow
```bash
cd frontend
bun install
bun run prisma:push    # Create/push schema to DB
bun run prisma:seed     # Seed default species
bun run dev             # Start dev server on :3000
```

---

## Current Implementation Status

### ✅ Completed Pages (SSR + Client)
- Landing (`/`) — bilingual
- Sign-in / Sign-up — Clerk widgets
- Dashboard — role-aware cards
- `/pets`, `/pets/:petId` — pet list + detail with vaccinations, monitoring, health events
- `/vet/*` — vet dashboard, add pet, visits, daily reports, hotel management, search
- `/clinic/*` — clinic index, reports
- `/hotel/*` — hotel index, add pet, history, search, booking detail, reports
- `/admin` — admin panel
- `/settings` — user settings
- `/onboarding/*` — role registration
- `/share/hotel/:token`, `/share/vet/:token` — public share links

### ✅ Completed API Endpoints (42 handlers)
All CRUD endpoints for: health, species, users, pets (vaccinations, health events, monitoring), visits (daily reports, sharing), clinics (staff, products, reports), hotel bookings (daily logs, sharing, standalone), search, shared links.

### ⚠️ In Progress / Known Gaps
- Reports & analytics pages (clinic reports detail, hotel reports)
- Admin functionality may need expansion
- Settings page may need more features
- PostgreSQL migration for full production use

### Legacy
- `_legacy/` — original pnpm/Express/Drizzle codebase. Keep for reference. Delete once confirmed no missing features.

---

## Changelog

_Add entries below each time you add, remove, rename, or significantly change something. Use `YYYY-MM-DD` format._

### 2026-06-09
- Created `CLAUDE.md` — AI project context file with architecture, conventions, and changelog

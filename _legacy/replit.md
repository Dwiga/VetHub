# PetHub

A full-stack veterinary clinic and pet management web app (mobile-optimized) for Indonesia. Handles pet owners tracking their pets' health, vets managing clinic visits, and clinic owners managing staff and analytics.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/vetcare run dev` — run the React frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite lib declarations first
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Wouter routing
- Auth: Clerk (provisioned via Replit integration)
- API: Express 5 + Clerk middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Charts: Recharts
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod schemas
- `lib/db/src/schema/` — Drizzle schema files (users, clinics, species, pets, visits, products)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/vetcare/src/pages/` — React page components
- `artifacts/vetcare/src/components/` — Shared UI components

## Architecture decisions

- Contract-first API: OpenAPI spec generates both client hooks and Zod validators
- Backend routes use Clerk's `getAuth(req)` for auth, auto-create user records on first call
- Numeric DB fields (price, weight, temperature) stored as PostgreSQL numeric strings, parsed to float in API responses
- Mobile-first design with bottom navigation bar; max-w-lg mx-auto for content
- Species seeded directly via DB (POST /api/species requires auth)

## Product

**Pet owner features:** Register as pet owner, add/edit pets, view health monitoring charts (weight/height/temperature), browse visit history.

**Vet features:** Search pet owners by phone number or pet name, create inpatient/outpatient visits, manage anamnesis, therapy, visit items (service/medicine/supporting/other), daily inpatient reports, print visit summary.

**Clinic owner features:** Manage clinic profile, invite/remove staff vets, manage product catalog (POS items), view revenue and visit analytics (daily/monthly/yearly charts).

## User preferences

- Mobile-optimized (375-430px primary), max-w-lg mx-auto containers
- No emojis in UI
- Indonesian context: prices shown as Rp formatted with id-ID locale
- Teal/green primary color (HSL 175 70% 25%)

## Gotchas

- Always run `pnpm run typecheck:libs` before typechecking API server (lib types must be built first)
- Species POST requires Clerk auth — seed directly via DB if needed
- Backend esbuild bundles at build time (doesn't typecheck); TS7030 "not all paths return value" errors in Express routes are benign
- Orval config uses single-mode Zod output to avoid TS2308 collision

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

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
- [Production Build](#production-build)
- [Deployment](#deployment)
  - [Docker Compose (recommended)](#docker-compose-recommended)
  - [Single Docker container](#single-docker-container)
  - [Bare-metal / VM](#bare-metal--vm)
  - [Production database — SQLite vs PostgreSQL](#production-database--sqlite-vs-postgresql)
  - [TLS with Let's Encrypt](#tls-with-lets-encrypt)
  - [CI / CD notes](#ci--cd-notes)
  - [Cloud-platform notes (Vercel, Render, Fly, Railway)](#cloud-platform-notes-vercel-render-fly-railway)
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
bun run dev              # Vite + TanStack Start dev server on :3000 (HMR)
bun run build            # production build → frontend/dist/{client,server}
bun run start:prod       # serve the built app via Bun on $PORT (default 3000)
bun run preview          # Vite's static preview (no SSR — for sanity only)
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
├── Dockerfile                         # multi-stage Bun build → single prod image
├── docker-compose.yml                 # prod stack: nginx + app + Postgres
├── docker-compose.dev.yml             # local dev convenience: just Postgres
├── .env.example                       # template env for the compose stack
├── .dockerignore
├── nginx/
│   └── nginx.conf                     # reverse proxy + TLS-ready config
├── frontend/                          # TanStack Start app (UI + API)
│   ├── prisma/
│   │   ├── schema.prisma              # Prisma schema (SQLite by default)
│   │   ├── seed.ts                    # idempotent seed (species)
│   │   └── dev.db                     # generated SQLite database (dev)
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
│   ├── server.ts                      # production Bun entry (static + SSR + /api)
│   ├── vite.config.ts                 # tanstackStart() + viteReact() + tailwindcss()
│   ├── tsconfig.json
│   ├── package.json
│   └── .env                           # local dev env (Clerk + DATABASE_URL)
├── backend/                           # FastAPI ingress proxy (Emergent pod only — NOT used in Docker/prod)
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

## Production Build

```bash
cd frontend
bun install --frozen-lockfile
bunx prisma generate
bun run build            # → dist/client (static) + dist/server (SSR + /api handler)
bun run start:prod       # serves both, on PORT (default 3000), via Bun.serve()
```

`server.ts` is a thin wrapper around the built SSR handler that:

- serves `dist/client/assets/*` with `Cache-Control: public, max-age=31536000, immutable`,
- serves other static files in `dist/client/` (favicon, public assets) with a one-hour cache,
- falls back to the TanStack Start handler for SSR + `/api/*`,
- blocks path-traversal attempts,
- listens on `$HOST:$PORT` (default `0.0.0.0:3000`).

That single process is what gets containerised below.

---

## Deployment

### Docker Compose (recommended)

The repo ships with a production stack in `docker-compose.yml`:

```
┌────────────┐     ┌──────────────────┐     ┌──────────────┐
│  nginx     │ ──▶ │  app (Bun)       │ ──▶ │  Postgres 16 │
│  :80 (:443)│     │  TanStack Start  │     │  (volume)    │
└────────────┘     │  SSR + /api +    │     └──────────────┘
                   │  static assets   │
                   └──────────────────┘
```

**1. Configure env**

```bash
cp .env.example .env
$EDITOR .env   # set POSTGRES_PASSWORD + Clerk keys
```

**2. (One-off) Switch Prisma to Postgres**

Open `frontend/prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "postgresql"     # was: "sqlite"
  url      = env("DATABASE_URL")
}
```

The rest of the schema is already Postgres-compatible — every column type used (`String`, `Int`, `Boolean`, `DateTime`) maps natively.

**3. Build & launch**

```bash
docker compose up --build -d
```

**4. First-boot DB bootstrap** (only the first time the volume is empty)

```bash
docker compose run --rm app bunx prisma db push
docker compose run --rm app bun run prisma/seed.ts
```

Alternatively set `RUN_DB_PUSH=1` and `RUN_DB_SEED=1` in `.env` *before* the first boot — the entrypoint will do it automatically. Unset them again for subsequent deploys.

**5. Visit** http://localhost (or your server's public IP).

**Useful ops commands**

```bash
docker compose ps                       # service status
docker compose logs -f app              # tail app logs
docker compose exec app sh              # shell into the Bun container
docker compose exec db psql -U vetcare  # psql into Postgres
docker compose down                     # stop (keeps the db_data volume)
docker compose down -v                  # ⚠ also drops the Postgres volume
```

**Scaling**

The app is stateless (sessions live in Clerk's JWTs). To horizontally scale:

```bash
docker compose up -d --scale app=3
```

nginx's `upstream vetcare_app { server app:3000; }` will round-robin across replicas via Docker's internal DNS — no extra config needed.

### Single Docker container

If you'd rather skip Compose (e.g. you already have a managed Postgres):

```bash
docker build \
  --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx \
  -t vetcare:latest .

docker run -d \
  --name vetcare \
  -p 3000:3000 \
  -e DATABASE_URL='postgresql://user:pass@host:5432/vetcare?schema=public' \
  -e CLERK_PUBLISHABLE_KEY=pk_test_xxx \
  -e CLERK_SECRET_KEY=sk_test_xxx \
  vetcare:latest
```

Note: `VITE_CLERK_PUBLISHABLE_KEY` is required at **build time** because Vite bakes it into the client bundle. The other env vars are runtime-only.

### Bare-metal / VM

No Docker required — just Bun:

```bash
# On the server:
curl -fsSL https://bun.sh/install | bash
git clone <your-repo> /opt/vetcare && cd /opt/vetcare/frontend
bun install --frozen-lockfile
bunx prisma generate
bun run build

# Create a systemd unit (example):
sudo tee /etc/systemd/system/vetcare.service > /dev/null <<'EOF'
[Unit]
Description=VetCare Pro (Bun + TanStack Start)
After=network.target

[Service]
Type=simple
User=vetcare
WorkingDirectory=/opt/vetcare/frontend
EnvironmentFile=/opt/vetcare/frontend/.env
ExecStart=/home/vetcare/.bun/bin/bun run server.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable --now vetcare
```

Then put nginx (or Caddy / Traefik) in front for TLS — the included `nginx/nginx.conf` works as-is when you change `upstream vetcare_app { server app:3000; }` to `server 127.0.0.1:3000;`.

### Production database — SQLite vs PostgreSQL

| Environment | Provider | Why |
|---|---|---|
| Local dev | **SQLite** (`file:./dev.db`) | Zero infra. Default in `prisma/schema.prisma`. |
| Tiny single-host prod | SQLite + persistent volume | Fine for low traffic if you accept single-process writes. Mount a volume at `/app/prisma/`. |
| Real production | **PostgreSQL 16** | Concurrent writes, backups, replicas. Use the bundled `docker-compose.yml` or a managed service (RDS / Neon / Supabase / Crunchy). |

Switching providers means editing **one line** in `frontend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"   # or "sqlite"
  url      = env("DATABASE_URL")
}
```

Then re-run `bunx prisma generate && bunx prisma db push`.

**Migrations**: for steady-state prod you want real migrations rather than `db push`. Switch to `prisma migrate dev` locally, commit the generated SQL under `prisma/migrations/`, and run `bunx prisma migrate deploy` in your CI.

### TLS with Let's Encrypt

The shipped `nginx/nginx.conf` has a commented-out HTTPS server block plus an ACME webroot location. The quick path with [certbot](https://certbot.eff.org/):

```bash
# 1. Ensure DNS for your domain points to this host and port 80 is reachable.
mkdir -p ./nginx/certs ./nginx/www
docker compose up -d web

# 2. Issue the cert.
docker run -it --rm \
  -v $(pwd)/nginx/certs:/etc/letsencrypt \
  -v $(pwd)/nginx/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
    -d vetcare.example.com --email you@example.com --agree-tos --no-eff-email

# 3. Symlink the issued cert into the path nginx expects.
ln -sf /etc/letsencrypt/live/vetcare.example.com/fullchain.pem ./nginx/certs/fullchain.pem
ln -sf /etc/letsencrypt/live/vetcare.example.com/privkey.pem   ./nginx/certs/privkey.pem

# 4. Uncomment the 443 server block + cert-mount in docker-compose.yml,
#    and the `return 301 https://...` line in nginx.conf.
docker compose up -d --force-recreate web
```

For auto-renewal, add a cron job or a `certbot` sidecar container that runs `certbot renew && nginx -s reload`.

### CI / CD notes

Recommended pipeline shape:

1. `bun install --frozen-lockfile`
2. `bunx prisma generate`
3. `bun run lint` (when you add ESLint)
4. `bun run build`
5. `bunx prisma migrate deploy` (against the prod DB, gated by a manual approval)
6. `docker build … && docker push …`
7. Deploy (e.g. `docker compose pull && docker compose up -d`)

The healthcheck baked into the Dockerfile uses `GET /api/health`, so blue/green or rolling deploys can wait on it.

### Cloud-platform notes (Vercel, Render, Fly, Railway)

The app is a standard Bun + TanStack Start project — any host that supports Bun (or a Dockerfile) will work.

- **Fly.io / Railway / Render** — point them at the included `Dockerfile`. Set the same env vars (`DATABASE_URL`, Clerk keys, plus the build arg `VITE_CLERK_PUBLISHABLE_KEY`). All three support managed Postgres add-ons.
- **Vercel** — TanStack Start has a Vercel deployment preset; you'd swap the bundler target and remove `server.ts` / `Dockerfile` (Vercel handles the runtime). Use Neon or Supabase for Postgres.
- **AWS Fargate / Google Cloud Run** — push the Docker image to ECR / Artifact Registry and connect to RDS / Cloud SQL via `DATABASE_URL`. The image listens on `$PORT`, so it works as-is.
- **Kubernetes** — wrap the image in a Deployment, terminate TLS at the Ingress, and inject env via a Secret. Liveness/readiness probes can hit `/api/health`.

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

Dynamic Database Adapter — Final State
How it works
db.ts checks DATABASE_URL at startup:
DATABASE_URL starts with	Adapter used
file:	PrismaLibSql (SQLite — local dev)
postgresql://	PrismaPg (PostgreSQL — production/Docker)
Files configured
File	Default	Override via
frontend/.env	file:./prisma/dev.db (SQLite)	Uncomment the PostgreSQL line
.envrc	file:./prisma/dev.db (SQLite)	Change to postgresql://...
frontend/prisma/schema.prisma	provider = "postgresql" (⚠️ see note below)	—
Dockerfile	No default (fails fast if missing)	docker-compose.yml passes PostgreSQL URL
Important note about Prisma provider
The schema has provider = "postgresql" (production target). For local SQLite dev, prisma db push and prisma migrate will fail because the PostgreSQL provider doesn't match the SQLite URL. You have two options for local schema updates:
1. Switch provider temporarily — Change to provider = "sqlite", run prisma db push, then switch back
2. Use PostgreSQL locally — docker compose -f docker-compose.dev.yml up -d gives you a local PostgreSQL, then:
DATABASE_URL="postgresql://vetcare:vetcare@localhost:5432/vetcare?schema=public" bun run prisma:push
The app itself will run fine with either database since the client generation is adapter-agnostic.

sudo -i -u postgres
psql

DB_PASSWORD=asdf1234@

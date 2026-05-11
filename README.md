# VetCare Pro

A full-stack veterinary clinic and pet management web app for Indonesia. Connects pet owners, veterinarians, and clinic owners in one platform — with mobile-optimized UI and bilingual support (Indonesian / English).

**5% of revenue from this app goes to street animal rescue organizations across Indonesia.**

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Using Bun](#using-bun)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Running with Docker](#running-with-docker)
- [Project Structure](#project-structure)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, shadcn/ui, Wouter |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk |
| API contract | OpenAPI spec → Orval codegen (React Query hooks + Zod schemas) |
| Package manager | pnpm workspaces (monorepo) |
| JS runtime | Node.js 24 (dev) / Bun (Docker production API) |

---

## Prerequisites

- **Node.js 24+** — [nodejs.org](https://nodejs.org)
- **pnpm 9+** — `npm install -g pnpm`
- **PostgreSQL 15+** — running locally or via Docker
- **Clerk account** — [clerk.com](https://clerk.com) (free tier works)
- **Bun** (optional) — [bun.sh](https://bun.sh) — can replace `node`/`pnpm run` for script execution after installing deps with pnpm

---

## Local Development

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd vetcare-pro
pnpm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for details on each key.

### 3. Set up the database

Make sure PostgreSQL is running, then push the schema:

```bash
pnpm --filter @workspace/db run push
```

### 4. Start the development servers

Open two terminals:

```bash
# Terminal 1 — API server (port 8080, served at /api)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — React frontend (port auto-assigned)
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/vetcare run dev
```

The app will be available at `http://localhost:3000`.

### 5. (Optional) Regenerate API client after spec changes

If you modify `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Using Bun

Bun is a fast, Node.js-compatible JavaScript runtime. You can use it as a drop-in replacement for `node` and `pnpm run` — but **package installation must still go through pnpm**.

### Why pnpm for install, Bun for everything else?

This workspace uses pnpm's `catalog:` version protocol and platform-specific package overrides in `pnpm-workspace.yaml`. Bun's package installer does not yet support these features, so `bun install` will fail. Once dependencies are installed with pnpm, Bun can run all scripts.

### Install Bun

```bash
# macOS / Linux
curl -fsSL https://bun.sh/install | bash

# Or via npm
npm install -g bun
```

### Local dev with Bun

```bash
# 1. Install dependencies — must use pnpm
pnpm install

# 2. Use bun run instead of pnpm run for scripts

# API server dev (port 8080)
bun --cwd artifacts/api-server run dev

# React frontend dev server
PORT=3000 BASE_PATH=/ bun --cwd artifacts/vetcare run dev

# Push DB schema
bun --cwd lib/db run push

# Typecheck
bun run typecheck
```

`bun run` reads the same `package.json` scripts as pnpm and uses the Bun runtime instead of Node.js — startup is noticeably faster, especially for the API server.

### Bun in Docker

The production API container (`api-runner` stage in `Dockerfile`) already uses `oven/bun:alpine`. The esbuild-bundled API server runs under Bun with no code changes needed — it's fully Node.js-compatible.

---

## Environment Variables

Create a `.env` file in the project root (or set these in your shell / Docker). See `.env.example` for the full template.

### Backend (`artifacts/api-server`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string, e.g. `postgres://user:pass@localhost:5432/vetcare` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key from your Clerk dashboard (starts with `sk_`) |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (starts with `pk_`) |
| `SESSION_SECRET` | Yes | Random secret string for session signing |
| `PORT` | Yes | Port the API server listens on (use `8080` in dev) |
| `NODE_ENV` | No | Set to `production` in production builds |

### Frontend build (`artifacts/vetcare`)

These are baked in at **Vite build time** and cannot be changed at runtime:

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Same publishable key as above |
| `VITE_CLERK_PROXY_URL` | No | Full URL to your Clerk proxy endpoint, e.g. `http://localhost/api/__clerk`. Leave empty to use Clerk directly. |
| `PORT` | Yes | Port Vite dev server listens on |
| `BASE_PATH` | Yes | URL base path, use `/` for local dev and Docker |

---

## Available Scripts

Run from the **project root** unless noted.

```bash
# Install all workspace dependencies
pnpm install

# Full typecheck (builds lib types first, then checks all packages)
pnpm run typecheck

# Build lib type declarations only
pnpm run typecheck:libs

# Build everything (typecheck + all packages)
pnpm run build

# Push DB schema changes to the database (dev only)
pnpm --filter @workspace/db run push

# Regenerate API client hooks and Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Run API server in dev mode (watch + rebuild)
pnpm --filter @workspace/api-server run dev

# Run React frontend dev server
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/vetcare run dev
```

---

## Running with Docker

The Docker setup uses **Alpine-based images** to keep the footprint small. It includes:

- `db` — PostgreSQL 16 (Alpine)
- `api` — Node.js 24 (Alpine) running the Express API server
- `web` — nginx (Alpine) serving the built React frontend and proxying `/api` to the API server

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed

### 1. Configure environment

Copy the example env file and fill in your Clerk keys:

```bash
cp .env.example .env
```

At minimum you need:

```env
CLERK_SECRET_KEY=sk_live_...
CLERK_PUBLISHABLE_KEY=pk_live_...
POSTGRES_PASSWORD=a-strong-password
SESSION_SECRET=a-long-random-string
```

> **Clerk keys:** Go to [clerk.com](https://clerk.com), create an application, and copy the keys from the API Keys page.

### 2. Build and start all services

```bash
docker compose up --build
```

This will:
1. Build the API server (esbuild bundle)
2. Build the React frontend (Vite, with Clerk key baked in)
3. Start PostgreSQL, the API server, and nginx

The app will be available at **http://localhost**.

### 3. Run database migrations

On first start (or after schema changes), apply the schema:

```bash
docker compose exec api node -e "
const { execSync } = require('child_process');
" 
```

Or run the push command from your host machine pointing at the Docker database:

```bash
DATABASE_URL=postgres://vetcare:changeme@localhost:5432/vetcare \
  pnpm --filter @workspace/db run push
```

> Replace `changeme` with your `POSTGRES_PASSWORD` from `.env`.

### 4. Useful Docker commands

```bash
# Start in background
docker compose up -d --build

# View logs
docker compose logs -f

# View logs for a specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db

# Stop all services
docker compose down

# Stop and delete volumes (wipes the database)
docker compose down -v

# Rebuild a single service after code changes
docker compose up --build api

# Open a shell in the API container
docker compose exec api sh

# Connect to the database
docker compose exec db psql -U vetcare -d vetcare
```

### 5. Custom port

To expose the app on a different host port, edit `docker-compose.yml`:

```yaml
web:
  ports:
    - "8080:80"   # app will be at http://localhost:8080
```

### 6. Production notes

- Set `NODE_ENV=production` in your `.env` (already the default in `docker-compose.yml`)
- Use a strong, random `SESSION_SECRET` and `POSTGRES_PASSWORD`
- For HTTPS, put a reverse proxy (e.g. Caddy, nginx, Traefik) in front of port 80
- The Clerk proxy (`/api/__clerk`) is already wired through nginx → API → Clerk. Set `VITE_CLERK_PROXY_URL=https://yourdomain.com/api/__clerk` in `.env` before building

---

## Project Structure

```
vetcare-pro/
├── artifacts/
│   ├── api-server/          # Express 5 API server
│   │   ├── src/
│   │   │   ├── routes/      # Route handlers (pets, visits, clinics, ...)
│   │   │   ├── middlewares/ # Clerk auth proxy
│   │   │   └── index.ts     # Entry point
│   │   └── build.mjs        # esbuild config
│   └── vetcare/             # React + Vite frontend
│       └── src/
│           ├── pages/       # Route-level page components
│           ├── components/  # Shared UI components
│           ├── contexts/    # React contexts (Lang, Role)
│           └── i18n/        # Translation files (en.ts, id.ts)
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   │   └── openapi.yaml
│   ├── api-client-react/    # Generated React Query hooks
│   ├── api-zod/             # Generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema + client
│       └── src/schema/      # Table definitions
├── scripts/                 # Utility scripts
├── Dockerfile               # Multi-stage Alpine Docker build
├── docker-compose.yml       # Postgres + API + nginx orchestration
├── nginx.conf               # nginx config (static files + API proxy)
├── .env.example             # Environment variable template
└── pnpm-workspace.yaml      # pnpm workspace + catalog config
```

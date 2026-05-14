# ────────────────────────────────────────────────────────────────────────────
# VetCare Pro — Multi-stage Dockerfile
#
# All runtime images are Alpine-based to keep the footprint small.
#
# Build stages:
#   base       — node:24-slim (Debian/glibc) + pnpm  ← build tooling only
#   deps       — install all workspace dependencies
#   build-api  — bundle the Express API server with esbuild
#   build-web  — build the React frontend with Vite
#   api-runner — node:24-alpine  (production API server)
#   web-runner — nginx:alpine    (static FE + /api reverse proxy)
#
# Notes:
#   • Build stages use Debian slim because TailwindCSS v4, Rollup, and
#     lightningcss ship glibc-only native binaries (the musl/Alpine variants
#     are excluded in pnpm-workspace.yaml overrides).
#   • Runtime stages are pure Alpine — the esbuild bundle needs no native
#     deps, and nginx is statically linked, so both are safe on musl.
#   • PostgreSQL is provided by docker-compose (postgres:16-alpine).
#
# Usage:
#   docker compose up --build        (recommended — uses docker-compose.yml)
#   docker build --target api-runner -t vetcare-api .
#   docker build --target web-runner --build-arg VITE_STACK_PROJECT_ID=... --build-arg VITE_STACK_PUBLISHABLE_CLIENT_KEY=pck_... -t vetcare-web .
# ────────────────────────────────────────────────────────────────────────────


# ── Stage 1: Build base — Node 24 slim (Debian/glibc, avoids musl issues) ────
#    TailwindCSS v4, Rollup, and lightningcss ship glibc-only native binaries;
#    the Alpine (musl) variants are excluded in pnpm-workspace.yaml overrides.
FROM node:24-alpine3.22  AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app


# ── Stage 2: Install all workspace dependencies ──────────────────────────────
FROM base AS deps

# Copy workspace manifests first — Docker layer cache busts only on changes
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./

# Copy every package manifest so pnpm can resolve the workspace graph
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json         ./lib/api-spec/
COPY lib/api-zod/package.json          ./lib/api-zod/
COPY lib/db/package.json               ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/vetcare/package.json    ./artifacts/vetcare/
COPY scripts/package.json             ./scripts/

RUN pnpm install --dangerously-allow-all-builds


# ── Stage 3: Build the API server ────────────────────────────────────────────
FROM deps AS build-api

COPY lib/              ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/db run push
RUN pnpm --filter @workspace/api-server run build


# ── Stage 4: Build the React frontend ────────────────────────────────────────
FROM deps AS build-web

# Stack Auth keys are baked into the JS bundle at build time.
# The publishable client key is intentionally public — safe to include in the image.
ARG VITE_STACK_PROJECT_ID=""
ARG VITE_STACK_PUBLISHABLE_CLIENT_KEY=""

ENV VITE_STACK_PROJECT_ID=$VITE_STACK_PROJECT_ID
ENV VITE_STACK_PUBLISHABLE_CLIENT_KEY=$VITE_STACK_PUBLISHABLE_CLIENT_KEY
ENV SESSION_SECRET=replace-with-a-long-random-string

# Required by vite.config.ts at config-evaluation time
ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=production

COPY lib/           ./lib/
COPY artifacts/vetcare/ ./artifacts/vetcare/

RUN pnpm --filter @workspace/vetcare run build


# ── Stage 5: API server runtime — node:24-alpine (minimal, pnpm-managed) ─────
FROM node:24-alpine3.22  AS api-runner

WORKDIR /app
ENV NODE_ENV=production

# Copy only the esbuild bundle — no node_modules needed (everything is bundled)
COPY --from=build-api /app/artifacts/api-server/dist ./dist

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]


# ── Stage 6: Frontend web server (nginx Alpine + static files) ────────────────
FROM nginx:alpine3.22 AS web-runner

# Copy the built React SPA
COPY --from=build-web /app/artifacts/vetcare/dist/public /var/www/html

# Copy the nginx config (serves static files + proxies /api to the API container)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

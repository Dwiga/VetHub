# ────────────────────────────────────────────────────────────────────────────
# VetCare Pro — Multi-stage Dockerfile
#
# Build stages:
#   base       — oven/bun Debian (glibc, avoids musl issues with native bins)
#   deps       — Install all workspace dependencies
#   build-api  — Bundle the Express API server with esbuild
#   build-web  — Build the React frontend with Vite
#   api-runner — oven/bun Alpine (Bun runtime, production API)
#   web-runner — nginx Alpine (static frontend + reverse proxy)
#
# Usage:
#   docker compose up --build
#   docker build --target api-runner -t vetcare-api .
#   docker build --target web-runner --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_... -t vetcare-web .
# ────────────────────────────────────────────────────────────────────────────


# ── Stage 1: Base ─────────────────────────────────────────────────────────────
FROM oven/bun:debian AS base
WORKDIR /app


# ── Stage 2: Install all workspace dependencies ──────────────────────────────
FROM base AS deps

COPY package.json bun.lock ./
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json         ./lib/api-spec/
COPY lib/api-zod/package.json          ./lib/api-zod/
COPY lib/db/package.json               ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/vetcare/package.json    ./artifacts/vetcare/
COPY scripts/package.json             ./scripts/

RUN bun install


# ── Stage 3: Build the API server ────────────────────────────────────────────
FROM deps AS build-api

COPY lib/              ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN bun run --cwd ./artifacts/api-server build


# ── Stage 4: Build the React frontend ────────────────────────────────────────
FROM deps AS build-web

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PROXY_URL=""

ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PROXY_URL=$VITE_CLERK_PROXY_URL

ENV PORT=3000
ENV BASE_PATH=/
ENV NODE_ENV=production

COPY lib/           ./lib/
COPY artifacts/vetcare/ ./artifacts/vetcare/

RUN bun run --cwd ./artifacts/vetcare build


# ── Stage 5: API server runtime (Bun on Alpine) ───────────────────────────────
FROM oven/bun:alpine AS api-runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build-api /app/artifacts/api-server/dist ./dist

EXPOSE 8080

CMD ["bun", "--smol", "./dist/index.mjs"]


# ── Stage 6: Frontend web server (nginx Alpine) ───────────────────────────────
FROM nginx:alpine AS web-runner

COPY --from=build-web /app/artifacts/vetcare/dist/public /var/www/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# ──────────────────────────────────────────────────────────────────────────────
# VetCare Pro — production image
#
# Multi-stage Bun build that produces a single self-contained image serving
# TanStack Start SSR + the /api/* ServerRoute handlers + the static client
# bundle on a single port. Postgres is expected to live in a separate
# container — see docker-compose.yml.
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1 ─ install all deps (including dev) + build ───────────────────────
FROM oven/bun:1.3-debian AS builder

WORKDIR /app

# Copy manifest first so layer caching keeps deps cached across source edits.
COPY frontend/package.json frontend/bun.lock* ./
# `bun install --frozen-lockfile` fails if bun.lock is out of sync — desirable for CI.
RUN bun install --frozen-lockfile

# Copy the rest of the frontend source.
COPY frontend/ ./

# Generate Prisma client for the Linux platform.
RUN bunx prisma generate

# Build the TanStack Start app (produces dist/client + dist/server).
# Build-time env vars: only VITE_* values are baked into the client bundle.
# For everything else we let the runtime container env take over.
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY}
RUN bun run build

# ── Stage 2 ─ slim runtime image ─────────────────────────────────────────────
FROM oven/bun:1.3-debian AS runtime

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

WORKDIR /app

# Only the artefacts we actually need at runtime.
COPY --from=builder /app/package.json         ./package.json
COPY --from=builder /app/bun.lock             ./bun.lock
COPY --from=builder /app/node_modules         ./node_modules
COPY --from=builder /app/dist                 ./dist
COPY --from=builder /app/server.ts            ./server.ts
COPY --from=builder /app/prisma               ./prisma

# Default DB location — must be set via `DATABASE_URL` environment variable
# (docker-compose.yml provides the Postgres connection string).
# No default is set here so the container fails fast if DATABASE_URL is missing.

EXPOSE 3000

# Entrypoint runs Prisma migrations on startup (safe — migrations are idempotent)
# and then starts the server.
RUN printf '#!/usr/bin/env sh\nset -e\nif [ -n "$RUN_DB_PUSH" ]; then\n  echo "[entrypoint] prisma db push"\n  bunx prisma db push --skip-generate\nfi\nif [ -n "$RUN_DB_SEED" ]; then\n  echo "[entrypoint] prisma seed"\n  bun run prisma/seed.ts\nfi\nexec bun run server.ts\n' > /usr/local/bin/entrypoint.sh \
 && chmod +x /usr/local/bin/entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e 'fetch("http://127.0.0.1:" + (process.env.PORT||3000) + "/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'

CMD ["/usr/local/bin/entrypoint.sh"]

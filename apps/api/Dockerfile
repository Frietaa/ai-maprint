# MABA PRINTING API — production container image (TASK-08.04).
#
# Build from the REPOSITORY ROOT (npm workspaces):
#   docker build -f apps/api/Dockerfile -t maba-printing-api .
#   docker build -f apps/api/Dockerfile --target migrate -t maba-printing-api-migrate .
#
# - runtime: compiled API + production dependencies only, non-root user, no
#   secrets or .env baked in (configure everything through the environment,
#   docs/DEPLOYMENT.md), liveness HEALTHCHECK on /api/v1/health.
# - migrate: one-off release step that runs `prisma migrate deploy` against
#   DATABASE_URL (never `migrate dev`/`reset`); run it before starting a new
#   runtime version.
# The base image is pinned by digest for reproducible builds; bump it
# deliberately (security updates).
ARG NODE_IMAGE=node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205

# --- build: full workspace install, compile shared + API ----------------------
FROM ${NODE_IMAGE} AS build
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# Scripts are skipped here; the API build runs `prisma generate` itself.
RUN npm ci --ignore-scripts -w @maba-printing/shared -w @maba-printing/api
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build -w @maba-printing/shared && npm run build -w @maba-printing/api

# --- migrate: release step (has the Prisma CLI) --------------------------------
FROM build AS migrate
WORKDIR /app/apps/api
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# --- production dependencies only ------------------------------------------------
FROM ${NODE_IMAGE} AS prod-deps
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false NPM_CONFIG_FUND=false
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci --ignore-scripts --omit=dev -w @maba-printing/shared -w @maba-printing/api
# npm still installs other workspaces' and optional peer packages (React,
# Prisma CLI, TypeScript); keep only what the built API can load.
COPY apps/api/scripts/prune-runtime-deps.mjs apps/api/scripts/
RUN node apps/api/scripts/prune-runtime-deps.mjs && rm -rf apps/api/scripts

# --- runtime -------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=prod-deps --chown=root:root /app/node_modules ./node_modules
COPY --from=build --chown=root:root /app/package.json ./
COPY --from=build --chown=root:root /app/packages/shared/package.json packages/shared/
COPY --from=build --chown=root:root /app/packages/shared/dist packages/shared/dist
COPY --from=build --chown=root:root /app/apps/api/package.json apps/api/
# Workspace-local versions (e.g. the API's own zod) live next to the API.
COPY --from=prod-deps --chown=root:root /app/apps/api/node_modules apps/api/node_modules
COPY --from=build --chown=root:root /app/apps/api/dist apps/api/dist
# Application files are read-only for the runtime user; uploads in flight go
# to the OS temp directory.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "apps/api/dist/server.js"]

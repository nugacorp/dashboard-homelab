# NUGA HOME - production image.
#
# Multi-stage: a full toolchain builds the SPA and compiles the server, then a
# slim runtime carries only production dependencies and the build output.
# No Vite dev server, no source, no dev dependencies in the final layer.

# ----------------------------------------------------------------- deps ---
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Full install (including dev deps) so the build stage can compile.
RUN npm ci --no-audit --no-fund

# ---------------------------------------------------------------- build ---
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.server.json vite.config.ts index.html ./
COPY shared ./shared
COPY server ./server
COPY scripts ./scripts
COPY src ./src
RUN npm run build

# --------------------------------------------------------- prod modules ---
FROM node:22-bookworm-slim AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# -------------------------------------------------------------- runtime ---
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

# curl is used by the container healthcheck below.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Run unprivileged. The node image already ships a `node` user (uid 1000).
USER node

EXPOSE 8080

# Liveness only: /api/health/live never contacts an upstream, so a dead Proxmox
# can never make Docker restart a perfectly healthy dashboard.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8080/api/health/live || exit 1

CMD ["node", "dist/server/index.js"]

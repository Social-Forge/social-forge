# syntax=docker/dockerfile:1
#
# Production image for the Social Forge app (AdonisJS + Inertia/Vite).
# Multi-stage: build assets with the full toolchain, resolve prod deps at the
# repo root (so pnpm's onlyBuiltDependencies config applies), ship a slim image.

FROM node:22-bookworm-slim AS base
RUN corepack enable
WORKDIR /app

# ---------- build (compile backend + frontend assets → ./build) ----------
FROM base AS build
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile
COPY . .
RUN node ace build

# ---------- production node_modules (workspace config honored) ----------
FROM base AS prod-deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
RUN pnpm install --prod --frozen-lockfile

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/build /app
COPY --from=prod-deps /app/node_modules /app/node_modules
EXPOSE 3333
CMD ["node", "bin/server.js"]

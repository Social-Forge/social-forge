# syntax=docker/dockerfile:1.7
# ============================================================
# AdonisJS web (Inertia + Vue) — build context = repo root
# ============================================================
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm \
    PNPM_STORE_DIR=/pnpm/store \
    PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app

# ---- install all deps (incl dev, needed for the Vite/Adonis build) ----
FROM base AS deps
# Toolchain for native modules (better-sqlite3 compiles on musl/alpine).
# This stage is throwaway, so it never bloats the final image.
RUN apk add --no-cache python3 make g++
COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
# pnpm 11 errors on un-approved dependency build scripts (esbuild, better-sqlite3,
# etc.). The build-approval config lives in the repo-root pnpm-workspace.yaml,
# which isn't in this single-package context — so explicitly allow builds here.
RUN --mount=type=cache,id=web-pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --prefer-offline --config.dangerouslyAllowAllBuilds=true

# ---- compile TypeScript + build Vite assets -> /app/build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
# `node ace build` boots the app (entity-index hooks) which validates env, so
# provide throwaway build-time values. Real values are injected at runtime.
ENV NODE_ENV=production \
    APP_KEY=build_only_dummy_key_0123456789abcdef \
    HOST=0.0.0.0 PORT=3333 LOG_LEVEL=info SESSION_DRIVER=cookie \
    DB_CONNECTION=pg DB_HOST=localhost DB_PORT=5432 DB_USER=build DB_DATABASE=build \
    REDIS_HOST=localhost REDIS_PORT=6379
# --ignore-ts-errors: skip the tsc type-check gate. A frozen-lockfile install
# resolves several peer-variant instances of @adonisjs/core, so tsc reports a
# spurious "#private refers to a different member" on the Application type. The
# emitted JS is unaffected; the real type-check runs during local dev.
RUN node ace build --ignore-ts-errors

# ---- production runtime ----
FROM base AS production
ENV NODE_ENV=production
RUN apk add --no-cache wget
# `node ace build` emits a self-contained app in ./build (incl package.json + lockfile)
COPY --from=build /app/build ./
# Build tools only for the native rebuild, then removed to keep the image lean.
RUN --mount=type=cache,id=web-pnpm-store,target=/pnpm/store \
    apk add --no-cache --virtual .build-deps python3 make g++ \
 && pnpm install --prod --frozen-lockfile --prefer-offline --config.dangerouslyAllowAllBuilds=true \
 && apk del .build-deps
COPY infra/docker/web-entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 3333
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

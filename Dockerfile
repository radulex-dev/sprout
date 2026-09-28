# syntax=docker/dockerfile:1

# ── Base ────────────────────────────────────────────────────────────────────────
FROM oven/bun:1 AS base
WORKDIR /app

# ── Dev ─────────────────────────────────────────────────────────────────────────
# Local dev: compose bind-mounts src/public/config so HMR works; node_modules
# stays inside the image to avoid host/container native-binary drift.
FROM base AS dev
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["bun", "run", "start"]

# ── Prod ────────────────────────────────────────────────────────────────────────
FROM base AS build
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
ARG DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_BUILD_ID
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
RUN bun run build

FROM oven/bun:1-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# `output: 'standalone'` traces the runtime deps into .next/standalone, so the
# prod image ships that tree instead of a full node_modules + source checkout.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/package.json /app/drizzle.config.ts ./
COPY --from=build /app/drizzle ./drizzle
RUN bun add --no-save drizzle-kit@0.31.10
EXPOSE 3000
CMD ["bun", "server.js"]

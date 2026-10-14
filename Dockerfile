# syntax=docker/dockerfile:1

# ---- deps: install all packages (dev deps are needed to build and seed) ----
FROM node:24-bookworm-slim AS deps
WORKDIR /app
# The Prisma CLI (migrations, seed) expects OpenSSL to be present.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# prisma generate (postinstall) reads the config, which needs a URL to exist.
# It does not connect; the real URL is supplied at runtime.
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npm ci

# ---- builder: compile the app. Also used by the "migrate" compose service
# to run migrations and the library seed, since it has the full toolchain. ----
FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build \
 && mkdir -p /app/storage && chown node:node /app/storage

# ---- runner: minimal production image ----
FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    STORAGE_DIR=/app/storage

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p /app/storage && chown node:node /app/storage

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

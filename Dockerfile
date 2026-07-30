# syntax=docker/dockerfile:1
#
# One portable image for RenderAI. Runs as the WEB server by default, or as the
# render WORKER when the command is overridden with `pnpm worker`.
# Same image deploys to: a VPS (docker compose), Render (docker runtime), or
# Cloudflare Containers — no code differences (12-factor, config via env).

FROM node:24-bookworm-slim AS base
RUN npm install -g pnpm@11.5.2
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: full install (dev deps are needed for `next build`, the tsx worker,
#       and drizzle-kit migrations inside the image).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- builder: compile the Next.js app.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runner: production runtime (serves both web and worker roles).
FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --chown=nextjs:nodejs \
  package.json pnpm-lock.yaml pnpm-workspace.yaml \
  next.config.ts tsconfig.json drizzle.config.ts ./

USER nextjs
ENV PORT=3000
EXPOSE 3000

# Default role = web. The worker service overrides this with: pnpm worker
CMD ["node", "scripts/start-standalone.mjs"]

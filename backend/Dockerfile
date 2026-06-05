# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Run as non-root for security
RUN addgroup -g 1001 -S nodejs && adduser -S simtrace -u 1001
USER simtrace

COPY --from=deps --chown=simtrace:nodejs /app/node_modules ./node_modules
COPY --chown=simtrace:nodejs . .

EXPOSE 4000
ENV NODE_ENV=production PORT=4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "server.js"]

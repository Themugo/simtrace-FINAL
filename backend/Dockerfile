# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npx tsc

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S simtrace -u 1001 -G nodejs
USER simtrace

COPY --from=builder --chown=simtrace:nodejs /app/dist ./dist
COPY --from=builder --chown=simtrace:nodejs /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

EXPOSE 4000
ENV NODE_ENV=production PORT=4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]

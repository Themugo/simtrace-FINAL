import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import http, { Server as HttpServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import pino, { Logger } from "pino";
import pinoHttp from "pino-http";
import { connectDB } from "./db/index.js";
import { seedPlans } from "./services/billing.js";
import { initIO } from "./services/socket.js";
import { authenticateSocket } from "./middleware/auth.js";
import { sanitizeInput } from "./middleware/validation.js";
import { notFoundHandler } from "./middleware/errorHandler.js";
import { initializeQueues } from "./queues/index.js";
import { correlationIdMiddleware, globalErrorHandler } from "./middleware/globalErrorHandler.js";
import { ipRateLimiter, ipThrottlingMiddleware, abuseDetectionMiddleware, securityHeadersMiddleware, initializeSecurityMiddleware } from "./middleware/securityHardening.js";
import { metricsMiddleware } from "./observability/metrics.js";
import "./observability/tracing.js";
import { startAlertMonitoring } from "./observability/alerting.js";
import "./sentry.js";

// Route imports
import authRoutes      from "./routes/auth.js";
import deviceRoutes    from "./routes/devices.js";
import imeiRoutes      from "./routes/imei.js";
import trackRoutes     from "./routes/track.js";
import alertRoutes     from "./routes/alerts.js";
import aiRoutes        from "./routes/ai.js";
import aiIntegrationRoutes from "./routes/ai-integration.js";
import billingRoutes   from "./routes/billing.js";
import adsRoutes       from "./routes/ads.js";
import partnerRoutes   from "./routes/partner.js";
import adminRoutes     from "./routes/admin.js";
import communityRoutes from "./routes/community.js";
import lockRoutes      from "./routes/lock.js";
import healthRoutes    from "./routes/health.js";
import marketplaceRoutes from "./routes/marketplace.js";
import externalMarketplaceRoutes from "./routes/external-marketplace.js";
import notificationPreferencesRoutes from "./routes/notification-preferences.js";
import telecomAnalyticsRoutes from "./routes/telecom-analytics.js";
import auditLogsRoutes from "./routes/audit-logs.js";
import { startCron }    from "./services/cron.js";

const app: Express = express();
const server: HttpServer = http.createServer(app);
const isProd: boolean = process.env.NODE_ENV === "production";

// Trust Railway/Heroku/Vercel proxy — required for rate-limiter to see real IPs
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
}));

// ── Additional security headers ──────────────────────────────────────────────────
app.use(securityHeadersMiddleware);

// ── IP rate limiting ────────────────────────────────────────────────────────────
app.use(ipRateLimiter);

// ── IP throttling ───────────────────────────────────────────────────────────────
app.use(ipThrottlingMiddleware);

// ── Abuse detection ─────────────────────────────────────────────────────────────
app.use(abuseDetectionMiddleware);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins: string[] = (process.env.ALLOWED_ORIGINS || "http://localhost:3000").split(",").map((s: string) => s.trim());
app.use(cors({
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      const error = new Error("Not allowed by CORS") as any;
      error.status = 403;
      cb(error);
    }
  },
  credentials: true,
}));

// ── Input sanitization ─────────────────────────────────────────────────────────
app.use(sanitizeInput);

// ── Correlation ID middleware ───────────────────────────────────────────────────
app.use(correlationIdMiddleware);

// ── Metrics middleware ───────────────────────────────────────────────────────────
app.use(metricsMiddleware);

// ── Structured logging ────────────────────────────────────────────────────────
export const logger: Logger = pino({
  level: isProd ? "info" : "debug",
  ...(isProd ? {} : { transport: { target: "pino-pretty", options: { colorize: true } } }),
});
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === "/health" } }));

// ── Stripe webhook — MUST be before express.json() (needs raw body) ───────────
// Express Routers ARE callable as functions. We rewrite the path so the router
// sees "/stripe-webhook" relative to its own mount point.
app.post(
  "/api/billing/stripe-webhook",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response, next: NextFunction) => {
    req.url = "/stripe-webhook";   // strip the /api/billing prefix for the router
    billingRoutes(req, res, next);
  }
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));

// ── NoSQL injection protection ────────────────────────────────────────────────
// Strips keys with $ or . from user input — blocks $where/$gt injection attacks
app.use(mongoSanitize({ replaceWith: "_" }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
// Global: 200 req/15min per IP
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// Auth: 20 req/15min (brute-force protection)
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Too many auth attempts" } });

// IMEI check: 30 req/min per IP (prevents blacklist enumeration)
const imeiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "IMEI check rate limit exceeded — try again in a minute" } });

// Track: 120 req/min per IP (mobile agents ping every 30s per device)
const trackLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, message: { error: "Ping rate limit exceeded" } });

// AI: 30 req/min (independent of per-user monthly quota)
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "AI rate limit exceeded" } });

// ── M-Pesa callback IP whitelist ─────────────────────────────────────────────
// Safaricom publishes their callback IPs — only accept callbacks from them
const MPESA_CALLBACK_IPS = new Set([
  "196.201.214.200", "196.201.214.206", "196.201.213.114",
  "196.201.214.207", "196.201.214.208", "196.201.213.44",
  "196.201.212.127", "196.201.212.138", "196.201.212.129",
  "196.201.212.136", "196.201.212.74",  "196.201.212.69",
]);

function mpesaIpWhitelist(req: Request, res: Response, next: NextFunction): void {
  if (process.env.MPESA_ENV !== "production") return next(); // bypass in sandbox
  const ip = req.ip || req.connection.remoteAddress;
  const clean = ip?.replace("::ffff:", "");
  if (clean && MPESA_CALLBACK_IPS.has(clean)) return next();
  logger.warn({ ip: clean }, "M-Pesa callback rejected — IP not whitelisted");
  res.status(403).json({ error: "Forbidden" });
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/health", healthRoutes);

app.use("/api/auth",      authLimiter,  authRoutes);
app.use("/api/devices",               deviceRoutes);
app.use("/api/devices",               lockRoutes);     // lock/unlock/commands on /api/devices/:id/*
app.use("/api/imei",    imeiLimiter,  imeiRoutes);
app.use("/api/track",   trackLimiter, trackRoutes);
app.use("/api/alerts",                alertRoutes);
app.use("/api/ai",      aiLimiter,    aiRoutes);
app.use("/api/ai-integration", aiLimiter, aiIntegrationRoutes);
// Apply M-Pesa IP whitelist specifically to callback endpoint
app.post("/api/billing/mpesa-callback", mpesaIpWhitelist);
app.use("/api/billing",               billingRoutes);
app.use("/api/ads",                   adsRoutes);
app.use("/api/partner",               partnerRoutes);
app.use("/api/admin",                 adminRoutes);
app.use("/api/community",             communityRoutes);
app.use("/api/marketplace",           marketplaceRoutes);
app.use("/api/external-marketplace",  externalMarketplaceRoutes);
app.use("/api/notification-preferences", notificationPreferencesRoutes);
app.use("/api/telecom-analytics",     telecomAnalyticsRoutes);
app.use("/api/audit-logs",            auditLogsRoutes);

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = initIO(server, allowedOrigins);
io.use(authenticateSocket);

io.on("connection", (socket) => {
  const { userId, role } = socket.data;
  socket.join(`user:${userId}`);
  if (role === "admin") socket.join("role:admin");

  socket.on("subscribe_device", (imei: unknown) => {
    if (typeof imei === "string" && /^\d{15,17}$/.test(imei)) {
      socket.join(`device:${imei}`);
    }
  });

  // Admin map: subscribe to ALL device updates via role:admin room
  // (track.js already emits to "role:admin" for every ping)
  socket.on("subscribe_all_admin", () => {
    if (role === "admin") {
      socket.join("role:admin"); // already joined — no-op, but makes intent clear
    }
  });

  socket.on("disconnect", () => {
    if (!isProd) console.log(`Socket disconnected: ${socket.id}`);
  });

  if (!isProd) console.log(`Socket connected: ${socket.id} user:${userId} role:${role}`);
});

// ── 404 handler ────────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Global error handler ──────────────────────────────────────────────────────
app.use(globalErrorHandler);

// ── DB connection with retry ──────────────────────────────────────────────────
async function connectWithRetry(retries: number = 5, delay: number = 3000): Promise<void> {
  for (let i = 1; i <= retries; i++) {
    try {
      await connectDB();
      return;
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`MongoDB connection failed (attempt ${i}/${retries}) — retrying in ${delay}ms…`);
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
  }
}

// ── Graceful shutdown + uncaught error handlers ───────────────────────────────
process.on("unhandledRejection", (reason: unknown) => {
  console.error("[UnhandledRejection]", reason);
});
process.on("uncaughtException", (err: Error) => {
  console.error("[UncaughtException]", err);
  process.exit(1);
});
process.on("SIGTERM", () => {
  console.log("SIGTERM received — shutting down gracefully");
  server.close(() => process.exit(0));
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT: number = parseInt(process.env.PORT || "4000", 10);
connectWithRetry().then(async () => {
  seedPlans();
  startCron();
  await initializeQueues();
  await initializeSecurityMiddleware();
  startAlertMonitoring();
  server.listen(PORT, () => console.log(`SimTrace API → port ${PORT} [${isProd ? "production" : "development"}]`));
}).catch(err => {
  console.error("Failed to connect to MongoDB after retries:", err);
  process.exit(1);
});

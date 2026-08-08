import express, { Express } from "express";
import compression from "compression";
import { httpLoggerMiddleware } from "./config/logger.js";
import {
  helmetSecurity,
  corsSecurity,
  globalRateLimiter,
  mongoSanitizer,
  suspiciousActivityDetector,
} from "./middleware/security.middleware.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import apiRouter from "./routes/index.js";

export function createApp(): Express {
  const app: Express = express();

  // 1. Core Security & Parsing Middleware
  app.use(helmetSecurity);
  app.use(corsSecurity);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(compression());
  app.use(mongoSanitizer);
  app.use(suspiciousActivityDetector);

  // 2. Structured Request Logging & Global Rate Limiting
  app.use(httpLoggerMiddleware);
  app.use("/api", globalRateLimiter);

  // 3. API Router
  app.use("/api", apiRouter);

  // 4. Fallback 404 & Global Error Handling Envelopes
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}

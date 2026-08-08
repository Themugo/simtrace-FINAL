# SimTrace Backend Architecture Audit & Current State Report

**Date:** August 1, 2026  
**Auditor:** SimTrace Principal Enterprise Systems Architect  
**Status:** Phase 1.1 Enterprise Upgrade Initialized  

---

## 1. Executive Summary & Existing Architecture

The SimTrace backend is an Express-based Node.js service running on TypeScript (`tsx` / `tsc`). It interfaces with MongoDB via Mongoose, Redis for caching and rate limiting, Socket.IO for real-time events, and several third-party platforms (Africa's Talking SMS, Google GenAI, Stripe, Cloudinary).

### Key Architectural Characteristics
- **Server Entry Points:** `backend/server.ts` acts as a monolithic entry point handling server initialization, middleware binding, websocket instantiation, and mounting over 50 individual route modules.
- **Data Access:** Mongoose schemas exist in both `backend/models/*.ts` and inline declarations inside `backend/db/index.ts`.
- **Middleware & Pipeline:** Middleware includes `cors`, `helmet`, `express-rate-limit`, `pino-http`, custom JWT `auth.ts`, `audit.ts`, `securityHardening.ts`, and `globalErrorHandler.ts`.
- **Business Logic Distribution:** Heavily split across `backend/routes/`, `backend/services/`, and auxiliary domain directories (e.g., `backend/ai-core/`, `backend/analytics/`, `backend/forensics/`).

---

## 2. Identified Bottlenecks & Audit Findings

### A. Code Base & Folder Standardization (Duplications & Fragmentation)
1. **Duplicate Schemas & Models:** Mongoose schemas are duplicated between `backend/db/index.ts` and standalone `backend/models/*.ts` files (e.g., `User`, `Device`, `Audit`).
2. **Business Logic in Routes:** Express route handlers in `backend/routes/` contain direct database mutations, transaction logic, and validation inline instead of delegating to dedicated controller/service layers.
3. **Flattered Domain Directories:** Multiple top-level folders (`agents/`, `ai-core/`, `analytics/`, `audit/`, `billing/`, `blacklist/`, `compliance/`, `forensics/`) create path confusion and import circularities.

### B. Security Risks
1. **Unvalidated Environment Variables:** Environment variables (`DATABASE_URL`, `MONGO_URI`, `JWT_SECRET`, `REDIS_URL`) are read via `process.env` without upfront runtime validation schemas (Zod/Joi), leaving the application prone to silent failures.
2. **Inconsistent API Response Formats:** Some routes return `{ success: true, data }`, while others return raw objects or `{ error: string }`, complicating client integration and automated security monitoring.
3. **Failed Login & Suspicious Activity Tracking:** Lacks unified, persistent tracking of failed logins, brute-force rate limiting per IP/user across distributed nodes, and structured audit events.

### C. Scalability & Operational Risks
1. **Error Handling Disparity:** Errors thrown in async middleware are handled inconsistently; while `express-async-errors` is present, standard `AppError` response envelopes with `requestId` and `errorCode` are not strictly enforced across all 50+ routes.
2. **Logging Fragmentation:** Logs are fragmented between standard `console.log` statements and `pino`. No standardized request-scoped log context (capturing `requestId`, `userId`, `executionTime`, `ipAddress`, and endpoint).
3. **Missing Health Check Metrics:** Existing health check route is minimal and lacks deep diagnostic probes for DB readiness, uptime metrics, memory footprint, and Kubernetes liveness/readiness probes.

---

## 3. Recommended Phase 1.1 Action Plan

1. **Standardized Directory Structure:** Consolidate clean enterprise modules under `backend/src/`:
   - `config/` (environment.ts, database.ts, logger.ts)
   - `controllers/`
   - `services/`
   - `routes/`
   - `middleware/` (auth, error, security, validation)
   - `models/` (AuditLogs, UserSessions, SystemEvents, User, Device)
   - `utils/` (AppError.ts, apiResponse.ts)
   - `jobs/`
   - `websocket/`
   - `app.ts` & `server.ts`
2. **Environment Validation:** Implement Zod schema validation refusing startup if critical variables are missing.
3. **Global Error & Response Envelopes:** Enforce `{ success, data, message }` for 2xx responses and `{ success: false, message, errorCode, timestamp, requestId }` for errors.
4. **Structured Pino Logger:** Standardized middleware assigning unique `requestId` (UUID) to every incoming request.
5. **Enhanced Security Middleware:** Unified Helmet, CORS, brute-force protection, failed login tracking, and request sanitization.
6. **Enterprise Schemas:** Add `AuditLog`, `UserSession`, and `SystemEvent` persistent models.
7. **Comprehensive Diagnostics & Tests:** Standardize `/api/health` with deep checks and add Vitest test suites verifying authentication, error handling, responses, DB, and health endpoints.

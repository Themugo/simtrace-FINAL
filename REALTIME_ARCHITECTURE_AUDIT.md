# SimTrace Real-Time Architecture Audit & Scaling Blueprint

**Date:** August 1, 2026  
**Phase:** 3 — Real-Time Intelligence Infrastructure, Event Streaming & Queue Processing  
**Status:** Architecture Audited & Production Upgrade Blueprint Active  

---

## 1. Current Real-Time Architecture Overview

Prior to Phase 3, SimTrace relied on a single-node Socket.IO instance attached directly to the Express HTTP server:
- **Transport Layer:** WebSocket / HTTP Polling fallback attached to Node.js HTTP server.
- **State Management:** In-memory socket rooms (`device:${deviceId}`) local to a single process instance.
- **Event Flow:** Synchronous or polling-based event dispatching without distributed pub/sub or background queue processing.

---

## 2. Identified Scaling Bottlenecks & Limitations

1. **Single Point of Failure (No Horizontal Scaling):**  
   Socket connections were stored in local memory. If multiple backend container instances were deployed on Cloud Run / Kubernetes, sockets on Instance A could not receive broadcasts triggered on Instance B.
2. **Synchronous Heavy Operations:**  
   Device status updates, location processing, and notification dispatches ran inline on the main Express event loop, causing latency spikes under high load.
3. **Lack of Event Standardization:**  
   Events lacked structured envelopes containing `eventId`, `eventType`, `timestamp`, `source`, `payload`, and `severity`.
4. **Presence & Session Isolation:**  
   No centralized Redis key-value presence tracking for active investigators, connected mobile devices, and active socket sessions.

---

## 3. Phase 3 Production Architecture Blueprint

```
+-----------------------------------------------------------------------+
|                            Client Apps                                |
|           (Web Dashboard / Mobile App / Telecom Portals)               |
+-----------------------------------+-----------------------------------+
                                    |
                            WebSocket / HTTP
                                    |
                                    v
+-----------------------------------------------------------------------+
|                         Socket.IO Gateway                             |
|              (JWT Token Auth & Organization Isolation)               |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                          Redis Pub/Sub &                              |
|                          Redis Streams Hub                            |
|             (Cross-Instance Broadcasting & Event Bus)                 |
+-----------------+-----------------------------------+-----------------+
                  |                                   |
                  v                                   v
+-----------------------------------+   +-------------------------------+
|         Event Bus System          |   |       BullMQ Queue System     |
|   (Device, Case, User, Alert)     |   |   (Device, Report, Notif)     |
+-----------------+-----------------+   +-------------------------------+
                  |                                   |
                  v                                   v
+-----------------------------------------------------------------------+
|                       MongoDB Persistence &                           |
|                    Live Operations Center APIs                        |
+-----------------------------------------------------------------------+
```

---

## 4. Execution Plan & Component Inventory

- **Step 2 — Redis Infrastructure (`backend/src/config/redis.ts`):** Resilience, automatic retry fallback, in-memory mock fallback when standalone Redis is unverified, health checks.
- **Step 3 — Socket.IO Scaling Architecture (`backend/src/websocket/socket.server.ts`):** JWT token authentication, room management, Redis adapter pub/sub interface.
- **Step 4 — Centralized Event System (`backend/src/events/`):** Unified schemas for `DeviceEvent`, `CaseEvent`, `UserEvent`, `AlertEvent`, `SystemEvent`.
- **Step 5 & 6 — Queue Processing (`backend/src/jobs/queues.ts`):** Queue processors for `DEVICE_EVENTS_QUEUE`, `REPORT_QUEUE`, `NOTIFICATION_QUEUE`, `SYSTEM_QUEUE`.
- **Step 8 & 9 — Models (`backend/src/models/userPresence.model.ts`, `backend/src/models/notification.model.ts`):** MongoDB models with TTL indexes and status tracking.
- **Step 10 — Live Operations Center API (`backend/src/routes/live.routes.ts`):** `/api/live/status`, `/api/live/events`, `/api/live/connections`.
- **Step 11 — Frontend Foundation (`lib/socketClient.ts` & `lib/hooks/useRealtime.ts`):** Auto-reconnecting socket singleton, typed hooks.

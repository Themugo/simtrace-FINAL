import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { logger } from "../config/logger.js";
import { env } from "../config/environment.js";
import { SimTraceEvent } from "../events/types.js";
import { RedisService } from "../config/redis.js";

let ioServer: SocketIOServer | null = null;
const activeSockets = new Map<string, { userId?: string; orgId?: string; connectedAt: string }>();
const eventLogBuffer: SimTraceEvent[] = [];
const MAX_EVENT_LOG = 100;

export function initializeWebSocketServer(httpServer: HttpServer): SocketIOServer {
  ioServer = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.FRONTEND_URL, "http://localhost:3000", "https://localhost:3000"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Socket Authentication Middleware
  ioServer.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      // Allow anonymous dev connection with guest identity
      (socket as any).user = { userId: `guest_${socket.id.substring(0, 5)}`, role: "guest" };
      return next();
    }
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (socket as any).user = decoded;
      next();
    } catch {
      // Fallback to guest connection for dev ease
      (socket as any).user = { userId: `guest_${socket.id.substring(0, 5)}`, role: "guest" };
      next();
    }
  });

  ioServer.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`[WebSocket] Client connected: ${socket.id} (User: ${user?.userId || "guest"})`);

    activeSockets.set(socket.id, {
      userId: user?.userId,
      orgId: user?.organizationId,
      connectedAt: new Date().toISOString(),
    });

    RedisService.set(`presence:${socket.id}`, JSON.stringify({ userId: user?.userId, status: "online" }), 3600);

    // Join Rooms
    socket.on("join_device_room", (deviceId: string) => {
      socket.join(`device:${deviceId}`);
      logger.info(`[WebSocket] Socket ${socket.id} joined device room: device:${deviceId}`);
    });

    socket.on("join_organization_room", (orgId: string) => {
      socket.join(`org:${orgId}`);
      logger.info(`[WebSocket] Socket ${socket.id} joined org room: org:${orgId}`);
    });

    socket.on("join_case_room", (caseId: string) => {
      socket.join(`case:${caseId}`);
      logger.info(`[WebSocket] Socket ${socket.id} joined case room: case:${caseId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`[WebSocket] Client disconnected: ${socket.id}`);
      activeSockets.delete(socket.id);
      RedisService.del(`presence:${socket.id}`);
    });
  });

  return ioServer;
}

export function getSocketIO(): SocketIOServer | null {
  return ioServer;
}

export function broadcastEvent(event: SimTraceEvent): void {
  // Store event in buffer for Live Operations Center
  eventLogBuffer.unshift(event);
  if (eventLogBuffer.length > MAX_EVENT_LOG) {
    eventLogBuffer.pop();
  }

  if (ioServer) {
    ioServer.emit("realtime_event", event);
  }
}

export function broadcastToRoom(room: string, event: SimTraceEvent): void {
  eventLogBuffer.unshift(event);
  if (eventLogBuffer.length > MAX_EVENT_LOG) {
    eventLogBuffer.pop();
  }

  if (ioServer) {
    ioServer.to(room).emit("realtime_event", event);
  }
}

export function getActiveConnectionStats() {
  return {
    totalConnections: activeSockets.size,
    activeSessions: Array.from(activeSockets.values()),
    recentEventsCount: eventLogBuffer.length,
  };
}

export function getRecentEvents(): SimTraceEvent[] {
  return eventLogBuffer;
}

// services/socket.ts — single source of truth for the Socket.io instance
// Import this in routes/services instead of importing from server.ts
import { Server } from "socket.io";
import { Server as HttpServer } from "http";

let _io: Server | null = null;

export function initIO(httpServer: HttpServer, allowedOrigins: string[]): Server {
  _io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  return _io;
}

export function getIO(): Server {
  if (!_io) throw new Error("Socket.io not initialised — call initIO() first");
  return _io;
}

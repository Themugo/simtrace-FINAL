// services/socket.js — single source of truth for the Socket.io instance
// Import this in routes/services instead of importing from server.js
import { Server } from "socket.io";

let _io = null;

export function initIO(httpServer, allowedOrigins) {
  _io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  return _io;
}

export function getIO() {
  if (!_io) throw new Error("Socket.io not initialised — call initIO() first");
  return _io;
}

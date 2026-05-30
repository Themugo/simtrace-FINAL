import jwt from "jsonwebtoken";
import { User } from "../db/index.js";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

// ── HTTP middleware ───────────────────────────────────────────────────────────
export function authenticate(req: Request & { user?: any }, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const apiKey = req.headers["x-api-key"];

  // API key path (for partner integrations)
  if (apiKey) {
    return User.findOne({ apiKey }).then((user) => {
      if (!user) return res.status(401).json({ error: "Invalid API key" });
      req.user = user;
      next();
    }).catch(next);
  }

  // JWT path
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request & { user?: any }, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// ── Socket.io middleware ──────────────────────────────────────────────────────
export function authenticateSocket(socket: any, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.userId = payload.id;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function signToken(user: any) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

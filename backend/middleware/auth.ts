import jwt from "jsonwebtoken";
import { User } from "../db/index.js";
import { Request, Response, NextFunction } from "express";
import { Socket } from "socket.io";

const JWT_SECRET: string = process.env.JWT_SECRET || "dev-insecure-jwt-secret-change-me";
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is not set");
}

type JwtPayload = { id: string; role?: string; tokenVersion?: number };
interface ModelLike {
  findOne(filter: Record<string, unknown>): { lean(): Promise<Record<string, unknown> | null> };
}

// ── HTTP middleware ───────────────────────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const apiKey = req.headers["x-api-key"];

  // API key path (for partner integrations)
  if (apiKey) {
    return User.findOne({ apiKey }).then((user) => {
      if (!user) return res.status(401).json({ error: "Invalid API key" });
      req.user = user as unknown as { id: string; email: string; role: string };
      next();
    }).catch(next);
  }

  // JWT path
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization required" });
  }
  const token = header.slice(7);
  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  // Stateful check: load the live user so role/permission changes take effect at
  // once, and bumping tokenVersion (logout-all, password change/reset) revokes
  // every outstanding token. Backward-compatible: tokens minted before this
  // change carry no tokenVersion and match the default 0 until the next bump.
  User.findById(payload.id).then((user) => {
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });
    if ((user.tokenVersion ?? 0) !== (payload.tokenVersion ?? 0)) {
      return res.status(401).json({ error: "Token has been revoked" });
    }
    req.user = user as unknown as { id: string; email: string; role: string };
    next();
  }).catch(next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req.user as Record<string, unknown>)?.role;
  if (role !== "admin" && role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.user as Record<string, unknown>)?.role as string | undefined;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

export function requireSelfOrAdmin(paramName: string = "userId") {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as Record<string, unknown> | undefined;
    const role = user?.role as string | undefined;
    if (String(user?.id ?? '') === String(req.params[paramName] ?? '') || role === "admin" || role === "super_admin") {
      return next();
    }
    return res.status(403).json({ error: "Forbidden: you can only access your own resources" });
  };
}

export function requireRecordOwner(opts: { model: ModelLike; idParam: string; idField?: string; ownerFields: string[] }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Record<string, unknown> | undefined;
      const role = user?.role as string | undefined;
      if (role === "admin" || role === "super_admin") return next();
      const idField = opts.idField || opts.idParam;
      const rec = await opts.model.findOne({ [idField]: req.params[opts.idParam] }).lean();
      if (!rec) return res.status(404).json({ error: "Not found" });
      const uid = String(user?.id ?? '');
      const owned = opts.ownerFields.some((f) => rec[f] != null && String(rec[f]) === uid);
      if (!owned) return res.status(403).json({ error: "Forbidden: you can only access your own resources" });
      next();
    } catch (err) { next(err); }
  };
}

export function requireDeviceOwner(paramName: string = "deviceId") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Record<string, unknown> | undefined;
      const role = user?.role as string | undefined;
      if (role === "admin" || role === "super_admin") return next();
      const { Device } = await import("../db/index.js");
      const device = await Device.findById(req.params[paramName]).lean() as Record<string, unknown> | null;
      if (!device) return res.status(404).json({ error: "Device not found" });
      if (String(device.owner) !== String(user?.id ?? '')) {
        return res.status(403).json({ error: "Forbidden: you can only access your own devices" });
      }
      next();
    } catch (err) { next(err); }
  };
}

export function requireOrgAdmin(paramName: string = "id") {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as Record<string, unknown> | undefined;
      const role = user?.role as string | undefined;
      if (role === "admin" || role === "super_admin") return next();
      const { OrganizationMember } = await import("../db/index.js");
      const m = await OrganizationMember.findOne({ organization: req.params[paramName], user: user?.id ?? '' }).lean() as Record<string, unknown> | null;
      if (m && (m.role === "owner" || m.role === "admin")) return next();
      return res.status(403).json({ error: "Forbidden: requires organization owner/admin" });
    } catch (err) { next(err); }
  };
}

// ── Socket.io middleware ──────────────────────────────────────────────────────
export function authenticateSocket(socket: Socket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error("Authentication required"));
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data.userId = payload.id;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function signToken(user: { _id: string; role: string; email: string; tokenVersion?: number }) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email, tokenVersion: user.tokenVersion ?? 0 },
    JWT_SECRET,
    { expiresIn: "7d" } as jwt.SignOptions
  );
}

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment.js";
import { AppError } from "../utils/AppError.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: string;
    tokenVersion?: number;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Authentication token missing"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.userId || decoded.id || decoded.sub,
      email: decoded.email,
      phone: decoded.phone,
      role: decoded.role || "user",
      tokenVersion: decoded.tokenVersion || 0,
    };
    next();
  } catch (err) {
    next(AppError.unauthorized("Invalid or expired session token"));
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(`Role '${req.user.role}' is not authorized to access this resource`));
    }
    next();
  };
}

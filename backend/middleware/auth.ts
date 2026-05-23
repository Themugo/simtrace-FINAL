import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

interface JwtPayload {
  id: string;
  role: string;
  email: string;
}

// ── HTTP middleware ───────────────────────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const apiKey = req.headers['x-api-key'] as string;

  // API key path (for partner integrations)
  if (apiKey) {
    User.findOne({ apiKey })
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: 'Invalid API key' });
        }
        req.user = { id: user._id.toString(), email: user.email, role: user.role };
        next();
      })
      .catch(next);
    return;
  }

  // JWT path
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!roles.includes(req.user?.role || '')) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// ── Socket.io middleware ──────────────────────────────────────────────────────
import { Socket } from 'socket.io';

export function authenticateSocket(socket: Socket, next: (err?: Error) => void): void {
  const token = socket.handshake.auth?.token as string;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    socket.data.userId = payload.id;
    socket.data.role = payload.role;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export function signToken(user: { _id: any; role: string; email: string }): string {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

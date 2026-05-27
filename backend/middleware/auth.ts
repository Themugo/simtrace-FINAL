import { Request, Response, NextFunction } from 'express';
import { User } from '../db/index.js';
import { validateAccessToken } from '../services/session.js';

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

  // Access token path (new session-based auth)
  if (!header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization required' });
    return;
  }
  const token = header.slice(7);
  
  const sessionData = validateAccessToken(token);
  if (!sessionData) {
    res.status(401).json({ error: 'Invalid or expired access token' });
    return;
  }
  
  req.user = { id: sessionData.userId, email: sessionData.email, role: sessionData.role };
  next();
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
  
  const sessionData = validateAccessToken(token);
  if (!sessionData) {
    return next(new Error('Invalid token'));
  }
  
  socket.data.userId = sessionData.userId;
  socket.data.role = sessionData.role;
  next();
}

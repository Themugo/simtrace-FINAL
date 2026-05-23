import { Request, Response, NextFunction } from 'express';
import { Permission, Role, hasPermission, hasAnyPermission, hasAllPermissions } from './permissions.js';

// Middleware to check if user has a specific permission
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role;
    
    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!hasPermission(userRole, permission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

// Middleware to check if user has any of the specified permissions
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role;
    
    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!hasAnyPermission(userRole, permissions)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

// Middleware to check if user has all of the specified permissions
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role;
    
    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!hasAllPermissions(userRole, permissions)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

// Middleware to check if user has a specific role
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = req.user?.role as Role;
    
    if (!userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!roles.includes(userRole)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}

// Helper function to check permissions in code (not middleware)
export function checkPermission(userRole: Role, permission: Permission): boolean {
  return hasPermission(userRole, permission);
}

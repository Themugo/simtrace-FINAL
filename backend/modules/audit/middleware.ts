import { Request, Response, NextFunction } from 'express';
import { createAuditLog, AuditAction, AuditLogData } from './audit.js';

// Middleware to automatically log actions
export function auditLog(action: AuditAction, resourceType?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store audit data on the request for later use
    req.auditData = {
      action,
      resourceType,
      resourceId: req.params.id || req.body.id,
    };
    
    // Continue with the request
    const originalSend = res.send;
    res.send = function(this: Response, ...args: unknown[]) {
      // Log after response is sent
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const auditData: AuditLogData = {
          userId: req.user.id,
          action: req.auditData?.action || action,
          resourceType: req.auditData?.resourceType || resourceType,
          resourceId: req.auditData?.resourceId,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        };
        
        // Log asynchronously
        createAuditLog(auditData).catch(err => {
          console.error('[Audit] Failed to log:', err);
        });
      }
      
      return originalSend.apply(this, args);
    };
    
    next();
  };
}

// Helper to manually log an action
export function logAction(
  userId: string,
  action: AuditAction,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): void {
  const auditData: AuditLogData = {
    userId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    userAgent,
  };
  
  createAuditLog(auditData).catch(err => {
    console.error('[Audit] Failed to log:', err);
  });
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auditData?: {
        action: AuditAction;
        resourceType?: string;
        resourceId?: string;
      };
    }
  }
}

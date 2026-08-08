// Tenant Isolation Middleware
// Ensures database query scoping and API tenant enforcement

import { Request, Response, NextFunction } from 'express';

export function tenantIsolationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Get tenant ID from user context
  const tenantId = (req.user as any)?.tenantId || (req.user as any)?.id;
  
  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: 'Tenant ID required',
      code: 'TENANT_ID_REQUIRED',
    });
  }
  
  // Attach tenant ID to request for use in controllers
  (req as any).tenantId = tenantId;
  
  // Add tenant filter to all database queries
  (req as any).tenantFilter = { tenantId };
  
  next();
}

// Database query scoping helper
export function scopeQueryToTenant(query: Record<string, unknown>, tenantId: string) {
  return { ...query, tenantId };
}

// WebSocket tenant separation
export function validateSocketTenant(socket: { handshake: { auth?: { tenantId?: string } } }, tenantId: string): boolean {
  const socketTenantId = socket.handshake.auth?.tenantId;
  
  if (socketTenantId !== tenantId) {
    throw new Error('Tenant mismatch in WebSocket connection');
  }
  
  return true;
}

// Cache isolation
export function getTenantCacheKey(tenantId: string, key: string): string {
  return `tenant:${tenantId}:${key}`;
}

// Storage isolation
export function getTenantStoragePath(tenantId: string, path: string): string {
  return `tenants/${tenantId}/${path}`;
}

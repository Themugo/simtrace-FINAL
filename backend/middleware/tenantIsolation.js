// Tenant Isolation Middleware
// Ensures database query scoping and API tenant enforcement

export function tenantIsolationMiddleware(req, res, next) {
  // Get tenant ID from user context
  const tenantId = req.user?.tenantId || req.user?.id;
  
  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: 'Tenant ID required',
      code: 'TENANT_ID_REQUIRED',
    });
  }
  
  // Attach tenant ID to request for use in controllers
  req.tenantId = tenantId;
  
  // Add tenant filter to all database queries
  req.tenantFilter = { tenantId };
  
  next();
}

// Database query scoping helper
export function scopeQueryToTenant(query, tenantId) {
  return { ...query, tenantId };
}

// WebSocket tenant separation
export function validateSocketTenant(socket, tenantId) {
  const socketTenantId = socket.handshake.auth?.tenantId;
  
  if (socketTenantId !== tenantId) {
    throw new Error('Tenant mismatch in WebSocket connection');
  }
  
  return true;
}

// Cache isolation
export function getTenantCacheKey(tenantId, key) {
  return `tenant:${tenantId}:${key}`;
}

// Storage isolation
export function getTenantStoragePath(tenantId, path) {
  return `tenants/${tenantId}/${path}`;
}

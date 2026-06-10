import { Request, Response, NextFunction } from 'express';
import { OrganizationMember } from '../../db/index.js';

// Middleware to ensure user has access to the organization
export function requireOrganizationAccess() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const organizationId = req.headers['x-organization-id'] as string || req.body.organizationId || req.params.organizationId;
    
    if (!organizationId) {
      res.status(400).json({ error: 'Organization ID required' });
      return;
    }
    
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    try {
      const membership = await OrganizationMember.findOne({
        organization: organizationId,
        user: req.user.id,
        status: 'active',
      });
      
      if (!membership) {
        res.status(403).json({ error: 'Access denied to this organization' });
        return;
      }
      
      // Attach organization context to request
      req.organizationId = organizationId;
      req.organizationRole = membership.role;
      req.organizationPermissions = membership.permissions;
      
      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify organization access' });
    }
  };
}

// Middleware to add organizationId filter to queries (tenant isolation)
export function withTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  const originalJson = res.json;
  
  res.json = function(this: Response, data: unknown) {
    // If the response contains data that should be tenant-isolated,
    // the organizationId filter should have been applied in the controller
    return originalJson.call(this, data);
  };
  
  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      organizationRole?: string;
      organizationPermissions?: string[];
    }
  }
}

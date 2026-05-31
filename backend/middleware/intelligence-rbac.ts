// ── Intelligence Broker RBAC Middleware ───────────────────────────────────────────
// Role-based access control for intelligence broker endpoints

import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email?: string;
  };
}

// Stakeholder to role mapping
const STAKEHOLDER_ROLE_MAP: Record<string, string[]> = {
  device_owner: ["device_owner", "admin"],
  telecom_operator: ["telecom_operator", "admin"],
  law_enforcement: ["law_enforcement", "admin"],
  internal_admin: ["admin"],
};

// Operation permissions by role
const OPERATION_PERMISSIONS: Record<string, Record<string, string[]>> = {
  device_owner: {
    device_intelligence: ["read"],
    risk_scoring: ["read"],
    fraud_detection: ["read"],
    recovery_alert: ["read", "write"],
    recovery_actions: ["read", "write"],
  },
  telecom_operator: {
    device_intelligence: ["read"],
    risk_scoring: ["read"],
    fraud_detection: ["read"],
    recovery_alert: ["read"],
    recovery_actions: [],
  },
  law_enforcement: {
    device_intelligence: ["read"],
    risk_scoring: ["read"],
    fraud_detection: ["read"],
    recovery_alert: ["read"],
    recovery_actions: ["read"],
  },
  admin: {
    device_intelligence: ["read", "write"],
    risk_scoring: ["read", "write"],
    fraud_detection: ["read", "write"],
    recovery_alert: ["read", "write"],
    recovery_actions: ["read", "write"],
  },
};

// Check if user can access stakeholder intelligence
export function canAccessStakeholder(stakeholder: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowedRoles = STAKEHOLDER_ROLE_MAP[stakeholder];
    if (!allowedRoles || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: "Unauthorized to access this stakeholder's intelligence",
        required_roles: allowedRoles,
      });
    }

    next();
  };
}

// Check if user can perform operation
export function canPerformOperation(operation: string, permission: string = "read") {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const rolePermissions = OPERATION_PERMISSIONS[userRole] || OPERATION_PERMISSIONS["admin"];
    const operationPermissions = rolePermissions[operation] || [];

    if (!operationPermissions.includes(permission)) {
      return res.status(403).json({ 
        error: `Unauthorized to perform ${permission} operation on ${operation}`,
        required_permission: permission,
      });
    }

    next();
  };
}

// Check if user owns the device (for device_owner role)
export async function ownsDevice(req: AuthRequest, res: Response, next: NextFunction) {
  const userRole = req.user?.role;
  const imei = req.params.imei || req.body.imei;

  // Admins can access any device
  if (userRole === "admin") {
    return next();
  }

  // Only device_owners need ownership check
  if (userRole !== "device_owner") {
    return next();
  }

  if (!imei) {
    return res.status(400).json({ error: "IMEI required" });
  }

  try {
    const { Device } = await import("../db/index.js");
    const device = await Device.findOne({ imei });

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    if (device.owner?.toString() !== req.user?.id) {
      return res.status(403).json({ error: "You do not own this device" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify device ownership" });
  }
}

// Combined RBAC check for stakeholder + operation
export function checkIntelligenceAccess(stakeholder: string, operation: string, permission: string = "read") {
  return [
    canAccessStakeholder(stakeholder),
    canPerformOperation(operation, permission),
  ];
}

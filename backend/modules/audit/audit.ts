import mongoose from 'mongoose';

export enum AuditAction {
  // User actions
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PASSWORD_CHANGED = 'user_password_changed',
  
  // Device actions
  DEVICE_CREATED = 'device_created',
  DEVICE_UPDATED = 'device_updated',
  DEVICE_DELETED = 'device_deleted',
  DEVICE_LOCKED = 'device_locked',
  DEVICE_UNLOCKED = 'device_unlockED',
  
  // IMEI actions
  IMEI_LOOKUP = 'imei_lookup',
  IMEI_BLACKLISTED = 'imei_blacklisted',
  IMEI_WHITELISTED = 'imei_whitelisted',
  
  // Alert actions
  ALERT_CREATED = 'alert_created',
  ALERT_UPDATED = 'alert_updated',
  ALERT_DELETED = 'alert_deleted',
  ALERT_ACKNOWLEDGED = 'alert_acknowledged',
  
  // Billing actions
  BILLING_PLAN_CHANGED = 'billing_plan_changed',
  BILLING_PAYMENT = 'billing_payment',
  BILLING_REFUND = 'billing_refund',
  
  // Admin actions
  ADMIN_ACTION = 'admin_action',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_CHANGED = 'role_changed',
  
  // Evidence actions
  EVIDENCE_UPLOADED = 'evidence_uploaded',
  EVIDENCE_DELETED = 'evidence_deleted',
  EVIDENCE_VIEWED = 'evidence_viewed',
  
  // Community actions
  COMMUNITY_POST_CREATED = 'community_post_created',
  COMMUNITY_POST_DELETED = 'community_post_deleted',
  
  // Partner actions
  PARTNER_CREATED = 'partner_created',
  PARTNER_UPDATED = 'partner_updated',
  PARTNER_DELETED = 'partner_deleted',
}

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, enum: Object.values(AuditAction) },
  resourceType: { type: String },
  resourceId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 }, // 90 days TTL
}, {
  timestamps: true,
});

// Indexes for efficient querying
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

// Create an audit log entry
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await AuditLog.create(data);
  } catch (error) {
    console.error('[Audit] Failed to create audit log:', error);
  }
}

// Get audit logs for a user
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> {
  return AuditLog.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .lean();
}

// Get audit logs by action
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> {
  return AuditLog.find({ action })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .lean();
}

// Get audit logs by resource
export async function getAuditLogsByResource(
  resourceType: string,
  resourceId: string,
  limit: number = 50,
  skip: number = 0
): Promise<any[]> {
  return AuditLog.find({ resourceType, resourceId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .lean();
}

// Get all audit logs (admin only)
export async function getAllAuditLogs(
  limit: number = 100,
  skip: number = 0,
  filters?: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<any[]> {
  const query: any = {};
  
  if (filters?.userId) query.userId = filters.userId;
  if (filters?.action) query.action = filters.action;
  if (filters?.resourceType) query.resourceType = filters.resourceType;
  if (filters?.startDate || filters?.endDate) {
    query.timestamp = {};
    if (filters.startDate) query.timestamp.$gte = filters.startDate;
    if (filters.endDate) query.timestamp.$lte = filters.endDate;
  }
  
  return AuditLog.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .lean();
}

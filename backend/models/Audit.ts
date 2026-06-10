import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

// ── Audit Log ───────────────────────────────────────────────────────────────
interface IAuditLog {
  userId?: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>({
  userId: { type: oid, ref: 'User' },
  action: { type: String, required: true },
  resource: { type: String, required: true },
  resourceId: { type: String },
  method: { type: String, required: true },
  path: { type: String, required: true },
  ip: { type: String },
  userAgent: { type: String },
  statusCode: { type: Number },
  success: { type: Boolean, required: true },
  errorMessage: { type: String },
  metadata: { type: Mixed },
  timestamp: { type: Date, default: Date.now, index: true },
});
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ resource: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

const opts = { strict: false as const, timestamps: true };

const dashboardAccessLogSchema = new mongoose.Schema({
  logId: { type: String, unique: true, sparse: true, index: true },
  user: { type: oid, ref: 'User', index: true }, dashboard: String, action: String,
  riskScore: { type: Number, default: 0 }, suspiciousActivity: { type: Boolean, default: false, index: true },
  ipAddress: String, userAgent: String,
}, opts);
export const DashboardAccessLog = mongoose.models.DashboardAccessLog || mongoose.model('DashboardAccessLog', dashboardAccessLogSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  deviceInfo?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, index: true },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);

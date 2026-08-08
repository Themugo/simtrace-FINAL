import mongoose, { Schema, Document } from "mongoose";

export type AlertType =
  | "HIGH_RISK_DEVICE"
  | "SUSPICIOUS_SIM_ACTIVITY"
  | "LOCATION_ANOMALY"
  | "NETWORK_CLUSTER"
  | "FRAUD_PATTERN";

export type AlertStatus = "NEW" | "UNDER_REVIEW" | "CONFIRMED" | "DISMISSED";

export interface IIntelligenceAlert extends Document {
  organizationId?: string;
  entityId: string;
  alertType: AlertType;
  priority: "low" | "medium" | "high" | "critical";
  riskScore: number;
  description: string;
  status: AlertStatus;
  createdAt: Date;
}

const intelligenceAlertSchema = new Schema<IIntelligenceAlert>(
  {
    organizationId: { type: String, index: true },
    entityId: { type: String, required: true, index: true },
    alertType: {
      type: String,
      enum: ["HIGH_RISK_DEVICE", "SUSPICIOUS_SIM_ACTIVITY", "LOCATION_ANOMALY", "NETWORK_CLUSTER", "FRAUD_PATTERN"],
      required: true,
      index: true,
    },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "high", index: true },
    riskScore: { type: Number, required: true, index: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["NEW", "UNDER_REVIEW", "CONFIRMED", "DISMISSED"], default: "NEW", index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const IntelligenceAlertModel =
  mongoose.models.IntelligenceAlert || mongoose.model<IIntelligenceAlert>("IntelligenceAlert", intelligenceAlertSchema);

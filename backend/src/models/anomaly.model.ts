import mongoose, { Schema, Document } from "mongoose";

export interface IAnomaly extends Document {
  entityId: string;
  type: string;
  severity: "info" | "warning" | "error" | "critical";
  description: string;
  confidence: number;
  detectedAt: Date;
}

const anomalySchema = new Schema<IAnomaly>(
  {
    entityId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true },
    severity: { type: String, enum: ["info", "warning", "error", "critical"], default: "warning", index: true },
    description: { type: String, required: true },
    confidence: { type: Number, required: true, default: 0.8 },
    detectedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const AnomalyModel = mongoose.models.Anomaly || mongoose.model<IAnomaly>("Anomaly", anomalySchema);

import mongoose, { Schema, Document } from "mongoose";

export interface ISystemEvent extends Document {
  eventType: string;
  source: string;
  payload: Record<string, any>;
  severity: "info" | "warning" | "error" | "critical";
  createdAt: Date;
}

const systemEventSchema = new Schema<ISystemEvent>(
  {
    eventType: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    severity: { type: String, enum: ["info", "warning", "error", "critical"], default: "info", index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const SystemEvent = mongoose.models.SystemEvent || mongoose.model<ISystemEvent>("SystemEvent", systemEventSchema);

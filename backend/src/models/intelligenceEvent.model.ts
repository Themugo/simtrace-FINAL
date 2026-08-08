import mongoose, { Schema, Document } from "mongoose";

export interface IIntelligenceEvent extends Document {
  entityId: string;
  eventType: string;
  source: string;
  payload: Record<string, any>;
  timestamp: Date;
  severity: "info" | "warning" | "error" | "critical";
}

const intelligenceEventSchema = new Schema<IIntelligenceEvent>(
  {
    entityId: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    source: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    severity: { type: String, enum: ["info", "warning", "error", "critical"], default: "info", index: true },
  },
  {
    timestamps: false,
  }
);

export const IntelligenceEventModel =
  mongoose.models.IntelligenceEvent || mongoose.model<IIntelligenceEvent>("IntelligenceEvent", intelligenceEventSchema);

import mongoose, { Schema, Document } from "mongoose";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface IRiskAssessment extends Document {
  entityId: string;
  score: number;
  level: RiskLevel;
  factors: Array<{ factor: string; points: number; description?: string }>;
  createdAt: Date;
}

const riskAssessmentSchema = new Schema<IRiskAssessment>(
  {
    entityId: { type: String, required: true, index: true },
    score: { type: Number, required: true, index: true },
    level: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true, index: true },
    factors: [
      {
        factor: { type: String, required: true },
        points: { type: Number, required: true },
        description: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const RiskAssessmentModel =
  mongoose.models.RiskAssessment || mongoose.model<IRiskAssessment>("RiskAssessment", riskAssessmentSchema);

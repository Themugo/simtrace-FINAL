import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendation extends Document {
  entityId: string;
  recommendation: string;
  priority: "low" | "medium" | "high" | "critical";
  generatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendation>(
  {
    entityId: { type: String, required: true, index: true },
    recommendation: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const RecommendationModel =
  mongoose.models.Recommendation || mongoose.model<IRecommendation>("Recommendation", recommendationSchema);

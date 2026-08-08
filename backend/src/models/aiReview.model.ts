import mongoose, { Schema, Document } from "mongoose";

export type ReviewDecision = "CONFIRM" | "DISMISS" | "ESCALATE";

export interface IAIReview extends Document {
  alertId: string;
  reviewerId: string;
  decision: ReviewDecision;
  notes?: string;
  createdAt: Date;
}

const aiReviewSchema = new Schema<IAIReview>(
  {
    alertId: { type: String, required: true, index: true },
    reviewerId: { type: String, required: true, index: true },
    decision: { type: String, enum: ["CONFIRM", "DISMISS", "ESCALATE"], required: true, index: true },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const AIReviewModel = mongoose.models.AIReview || mongoose.model<IAIReview>("AIReview", aiReviewSchema);

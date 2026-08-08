import mongoose, { Schema, Document } from "mongoose";

export interface IAIModelLog extends Document {
  modelName: string;
  version: string;
  input: Record<string, any>;
  output: Record<string, any>;
  createdAt: Date;
}

const aiModelLogSchema = new Schema<IAIModelLog>(
  {
    modelName: { type: String, required: true, index: true },
    version: { type: String, required: true, default: "v1.0.0" },
    input: { type: Schema.Types.Mixed, default: {} },
    output: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const AIModelLogModel =
  mongoose.models.AIModelLog || mongoose.model<IAIModelLog>("AIModelLog", aiModelLogSchema);

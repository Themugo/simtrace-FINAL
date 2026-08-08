import mongoose, { Schema, Document } from "mongoose";

export type EntityType = "DEVICE" | "SIM_CARD" | "PHONE_NUMBER" | "PERSON" | "LOCATION" | "CASE" | "ORGANIZATION";

export interface IEntity extends Document {
  organizationId?: string;
  entityType: EntityType;
  externalId: string; // e.g. IMEI, IMSI, Phone number, Case ID, User ID
  name: string;
  metadata: Record<string, any>;
  riskScore: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const entitySchema = new Schema<IEntity>(
  {
    organizationId: { type: String, index: true },
    entityType: {
      type: String,
      enum: ["DEVICE", "SIM_CARD", "PHONE_NUMBER", "PERSON", "LOCATION", "CASE", "ORGANIZATION"],
      required: true,
      index: true,
    },
    externalId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    riskScore: { type: Number, default: 0, index: true },
    status: { type: String, default: "active", index: true },
  },
  {
    timestamps: true,
  }
);

entitySchema.index({ entityType: 1, externalId: 1 }, { unique: true });

export const EntityModel = mongoose.models.Entity || mongoose.model<IEntity>("Entity", entitySchema);

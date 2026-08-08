import mongoose, { Schema, Document } from "mongoose";

export type RelationshipType =
  | "DEVICE_USED_SIM"
  | "SIM_REGISTERED_TO_PERSON"
  | "DEVICE_LOCATED_AT"
  | "PERSON_ASSOCIATED_CASE"
  | "DEVICE_CONNECTED_DEVICE"
  | "PHONE_CONTACTED_PHONE"
  | "LOCATION_VISITED_BY_DEVICE"
  | "DEVICE_LINKED_TO_CASE";

export interface IRelationship extends Document {
  sourceEntityId: string;
  targetEntityId: string;
  relationshipType: RelationshipType;
  confidenceScore: number;
  metadata: Record<string, any>;
  createdAt: Date;
}

const relationshipSchema = new Schema<IRelationship>(
  {
    sourceEntityId: { type: String, required: true, index: true },
    targetEntityId: { type: String, required: true, index: true },
    relationshipType: {
      type: String,
      enum: [
        "DEVICE_USED_SIM",
        "SIM_REGISTERED_TO_PERSON",
        "DEVICE_LOCATED_AT",
        "PERSON_ASSOCIATED_CASE",
        "DEVICE_CONNECTED_DEVICE",
        "PHONE_CONTACTED_PHONE",
        "LOCATION_VISITED_BY_DEVICE",
        "DEVICE_LINKED_TO_CASE",
      ],
      required: true,
      index: true,
    },
    confidenceScore: { type: Number, default: 1.0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

relationshipSchema.index({ sourceEntityId: 1, targetEntityId: 1, relationshipType: 1 }, { unique: true });

export const RelationshipModel =
  mongoose.models.Relationship || mongoose.model<IRelationship>("Relationship", relationshipSchema);

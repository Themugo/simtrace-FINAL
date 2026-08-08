import mongoose, { Schema, Document } from "mongoose";

export interface IUserSession extends Document {
  userId: string;
  tokenHash: string;
  ipAddress?: string;
  device?: string;
  lastActive: Date;
  expiresAt: Date;
}

const userSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    ipAddress: { type: String },
    device: { type: String },
    lastActive: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  {
    timestamps: true,
  }
);

export const UserSession = mongoose.models.UserSession || mongoose.model<IUserSession>("UserSession", userSessionSchema);

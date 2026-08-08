import mongoose, { Schema, Document } from "mongoose";

export interface IUserPresence extends Document {
  userId: string;
  socketId: string;
  status: "online" | "offline" | "away";
  lastSeen: Date;
  deviceInfo?: string;
  createdAt: Date;
}

const userPresenceSchema = new Schema<IUserPresence>(
  {
    userId: { type: String, required: true, index: true },
    socketId: { type: String, required: true, index: true },
    status: { type: String, enum: ["online", "offline", "away"], default: "online", index: true },
    lastSeen: { type: Date, default: Date.now },
    deviceInfo: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
);

export const UserPresence = mongoose.models.UserPresence || mongoose.model<IUserPresence>("UserPresence", userPresenceSchema);

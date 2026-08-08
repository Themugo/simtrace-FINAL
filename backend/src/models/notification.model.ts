import mongoose, { Schema, Document } from "mongoose";

export type NotificationType = "CASE_ALERT" | "DEVICE_ALERT" | "SECURITY_ALERT" | "SYSTEM_MESSAGE";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface INotification extends Document {
  userId: string;
  organizationId?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    type: { type: String, enum: ["CASE_ALERT", "DEVICE_ALERT", "SECURITY_ALERT", "SYSTEM_MESSAGE"], required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium", index: true },
    read: { type: Boolean, default: false, index: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>("Notification", notificationSchema);

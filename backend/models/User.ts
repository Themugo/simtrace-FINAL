import mongoose from 'mongoose';

// ── User ──────────────────────────────────────────────────────────────────────
interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'super_admin' | 'telecom' | 'law_enforcement';
  phone?: string;
  apiKey?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  mustChangePassword?: boolean;
  tokenVersion?: number;
  authProvider?: 'local' | 'google';
  providerId?: string;
  createdAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  role: { type: String, enum: ['user', 'admin', 'super_admin', 'telecom', 'law_enforcement'], default: 'user' },
  tokenVersion: { type: Number, default: 0 },
  phone: { type: String },
  apiKey: { type: String, index: true, sparse: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  mustChangePassword: { type: Boolean, default: false },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  providerId: { type: String, index: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
});
export const User = mongoose.model<IUser>('User', userSchema);

// ── Password reset tokens ─────────────────────────────────────────────────────
interface IPasswordReset {
  user: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  used: boolean;
}

const resetSchema = new mongoose.Schema<IPasswordReset>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
});
resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const PasswordReset = mongoose.model<IPasswordReset>('PasswordReset', resetSchema);

// ── Notification Preferences ─────────────────────────────────────────────────────
interface INotificationPreferences {
  user: mongoose.Types.ObjectId;
  channels: {
    sms: boolean;
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  alertTypes: {
    theft_report: boolean;
    sim_swap: boolean;
    location_jump: boolean;
    fraud_pattern: boolean;
    blacklist_ping: boolean;
    recovery_update: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const notificationPreferencesSchema = new mongoose.Schema<INotificationPreferences>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  channels: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
  },
  alertTypes: {
    theft_report: { type: Boolean, default: true },
    sim_swap: { type: Boolean, default: true },
    location_jump: { type: Boolean, default: true },
    fraud_pattern: { type: Boolean, default: true },
    blacklist_ping: { type: Boolean, default: true },
    recovery_update: { type: Boolean, default: true },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '22:00' },
    end: { type: String, default: '08:00' },
    timezone: { type: String, default: 'Africa/Nairobi' },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
export const NotificationPreferences = mongoose.model<INotificationPreferences>('NotificationPreferences', notificationPreferencesSchema);

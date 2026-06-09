import mongoose from 'mongoose';

interface IPartner {
  user?: mongoose.Types.ObjectId;
  orgName: string;
  orgType: 'telecom' | 'law_enforcement' | 'marketplace' | 'insurance';
  country: string;
  apiKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
  tier: 'basic' | 'standard' | 'premium';
  apiCallsMonth: number;
  apiCallsLimit: number;
  lastReset: Date;
  status: 'pending' | 'active' | 'suspended';
  createdAt: Date;
}

const partnerSchema = new mongoose.Schema<IPartner>({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orgName: { type: String, required: true },
  orgType: { type: String, enum: ['telecom', 'law_enforcement', 'marketplace', 'insurance'], required: true },
  country: { type: String, default: 'KE' },
  apiKey: { type: String, unique: true, index: true },
  webhookUrl: String,
  webhookSecret: String,
  tier: { type: String, enum: ['basic', 'standard', 'premium'], default: 'basic' },
  apiCallsMonth: { type: Number, default: 0 },
  apiCallsLimit: { type: Number, default: 1000 },
  lastReset: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});
export const Partner = mongoose.model<IPartner>('Partner', partnerSchema);

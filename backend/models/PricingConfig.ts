import mongoose from 'mongoose';

interface IPricingConfig {
  planId: string;
  priceKES?: number;
  priceUSD?: number;
  deviceLimit?: number;
  extraDeviceKES?: number;
  features?: string[];
  imeiChecksPerDay?: number;
  aiReportsPerMonth?: number;
  slaHours?: number | null;
  isActive: boolean;
  customForUser?: mongoose.Types.ObjectId;
  discountPercent?: number;
  discountValidUntil?: Date;
  waiverReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pricingConfigSchema = new mongoose.Schema<IPricingConfig>({
  planId: { type: String, required: true },
  priceKES: { type: Number },
  priceUSD: { type: Number },
  deviceLimit: { type: Number },
  extraDeviceKES: { type: Number },
  features: [{ type: String }],
  imeiChecksPerDay: { type: Number },
  aiReportsPerMonth: { type: Number },
  slaHours: { type: Number, default: null },
  isActive: { type: Boolean, default: true },
  customForUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  discountPercent: { type: Number, min: 0, max: 100 },
  discountValidUntil: { type: Date },
  waiverReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

pricingConfigSchema.index({ planId: 1, customForUser: 1 });
pricingConfigSchema.index({ customForUser: 1, isActive: 1 });

export const PricingConfig = mongoose.model<IPricingConfig>('PricingConfig', pricingConfigSchema);

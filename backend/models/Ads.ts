import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;

// ── Advertisement ─────────────────────────────────────────────────────────────
interface IAd {
  advertiser?: mongoose.Types.ObjectId;
  title: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  placement: 'dashboard_banner' | 'imei_sidebar' | 'devices_footer' | 'alert_feed';
  targetRoles: string[];
  targetPlans: string[];
  budgetKES: number;
  spentKES: number;
  cpcKES: number;
  impressions: number;
  clicks: number;
  status: 'pending' | 'active' | 'paused' | 'exhausted' | 'rejected';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
}

const adSchema = new mongoose.Schema<IAd>({
  advertiser: { type: oid, ref: 'User' },
  title: { type: String, required: true, maxlength: 80 },
  body: { type: String, required: true, maxlength: 200 },
  ctaText: { type: String, default: 'Learn More' },
  ctaUrl: { type: String, required: true },
  imageUrl: String,
  placement: { type: String, enum: ['dashboard_banner', 'imei_sidebar', 'devices_footer', 'alert_feed'], default: 'dashboard_banner' },
  targetRoles: [{ type: String }],
  targetPlans: [{ type: String }],
  budgetKES: { type: Number, required: true },
  spentKES: { type: Number, default: 0 },
  cpcKES: { type: Number, default: 5 },
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'active', 'paused', 'exhausted', 'rejected'], default: 'pending' },
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
});
export const Ad = mongoose.model<IAd>('Ad', adSchema);

// ── Ad click / impression event ───────────────────────────────────────────────
interface IAdEvent {
  ad: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  type: 'impression' | 'click';
  ip?: string;
  ts: Date;
}

const adEventSchema = new mongoose.Schema<IAdEvent>({
  ad: { type: oid, ref: 'Ad' },
  user: { type: oid, ref: 'User' },
  type: { type: String, enum: ['impression', 'click'] },
  ip: String,
  ts: { type: Date, default: Date.now },
});
adEventSchema.index({ ad: 1, ts: -1 });
export const AdEvent = mongoose.model<IAdEvent>('AdEvent', adEventSchema);

const opts = { strict: false as const, timestamps: true };

const adCampaignSchema = new mongoose.Schema({
  name: String, advertiser: Mixed, whiteLabel: Mixed,
  status: { type: String, default: 'draft', index: true },
  budget: Mixed, bidding: Mixed, targeting: Mixed,
  creatives: [Mixed], placements: [Mixed], schedule: Mixed, metrics: Mixed,
}, opts);
export const AdCampaign = mongoose.models.AdCampaign || mongoose.model('AdCampaign', adCampaignSchema);

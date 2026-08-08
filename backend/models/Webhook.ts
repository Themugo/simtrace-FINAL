import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const webhookDeliveryLogSchema = new mongoose.Schema({
  webhook: { type: oid, ref: 'WebhookSubscription', index: true },
  event: { type: String, index: true }, payload: Mixed,
  status: { type: String, index: true }, statusCode: Number, response: String, timestamp: Date,
}, opts);
export const WebhookDeliveryLog = mongoose.models.WebhookDeliveryLog || mongoose.model('WebhookDeliveryLog', webhookDeliveryLogSchema);

const webhookSubscriptionSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  url: String, secret: String, events: [Mixed], active: { type: Boolean, default: true, index: true },
}, opts);
export const WebhookSubscription = mongoose.models.WebhookSubscription || mongoose.model('WebhookSubscription', webhookSubscriptionSchema);

const processedWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, index: true }, eventId: String, eventType: String,
  processedAt: { type: Date, default: Date.now },
}, opts);
processedWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
export const ProcessedWebhookEvent = mongoose.models.ProcessedWebhookEvent || mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema);

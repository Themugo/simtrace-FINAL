import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;
const Mixed = mongoose.Schema.Types.Mixed;
const opts = { strict: false as const, timestamps: true };

const agencyConfigSchema = new mongoose.Schema({
  agencyId: { type: String, index: true }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const AgencyConfig = mongoose.models.AgencyConfig || mongoose.model('AgencyConfig', agencyConfigSchema);

const countryConfigSchema = new mongoose.Schema({
  countryCode: { type: String, index: true }, status: { type: String, default: 'active', index: true },
  createdBy: String, updatedBy: String,
}, opts);
export const CountryConfig = mongoose.models.CountryConfig || mongoose.model('CountryConfig', countryConfigSchema);

const deviceFleetSchema = new mongoose.Schema({
  organization: { type: oid, ref: 'Organization', index: true },
  name: String, description: String, autoRegister: { type: Boolean, default: false },
  deviceLimit: Number, monitoringEnabled: { type: Boolean, default: true }, alertThresholds: Mixed,
  status: { type: String, default: 'active', index: true },
}, opts);
export const DeviceFleet = mongoose.models.DeviceFleet || mongoose.model('DeviceFleet', deviceFleetSchema);

const deviceRegistrationSchema = new mongoose.Schema({
  registrationId: { type: String, unique: true, sparse: true, index: true },
  sellerId: { type: oid, ref: 'SellerReseller', index: true }, commissionAmount: Number,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const DeviceRegistration = mongoose.models.DeviceRegistration || mongoose.model('DeviceRegistration', deviceRegistrationSchema);

const partnerListingSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true }, organization: { type: oid, ref: 'Organization' },
  name: String, category: { type: String, index: true }, description: String,
  services: [Mixed], countries: [String], regions: [String], pricingModel: String,
  status: { type: String, default: 'active', index: true },
}, opts);
export const PartnerListing = mongoose.models.PartnerListing || mongoose.model('PartnerListing', partnerListingSchema);

const policyRuleSchema = new mongoose.Schema({
  name: { type: String, index: true }, enabled: { type: Boolean, default: true, index: true }, rule: Mixed,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const PolicyRule = mongoose.models.PolicyRule || mongoose.model('PolicyRule', policyRuleSchema);

const publicApiKeySchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true }, organization: { type: oid, ref: 'Organization' },
  keyName: String, keyHash: { type: String, index: true }, keyPrefix: { type: String, index: true },
  scopes: [String], rateLimit: { type: Number, default: 1000 }, expiresAt: Date,
  active: { type: Boolean, default: true, index: true },
}, opts);
export const PublicApiKey = mongoose.models.PublicApiKey || mongoose.model('PublicApiKey', publicApiKeySchema);

const repairRecordSchema = new mongoose.Schema({
  repairId: { type: String, unique: true, sparse: true, index: true },
  shopId: { type: oid, ref: 'RepairShop', index: true }, commissionAmount: Number,
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const RepairRecord = mongoose.models.RepairRecord || mongoose.model('RepairRecord', repairRecordSchema);

const repairShopSchema = new mongoose.Schema({
  shopId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const RepairShop = mongoose.models.RepairShop || mongoose.model('RepairShop', repairShopSchema);

const resellerSchema = new mongoose.Schema({
  user: { type: oid, ref: 'User', index: true },
  businessName: String, businessType: String, licenseNumber: String,
  address: String, phone: String, email: String, services: [Mixed],
  verified: { type: Boolean, default: false }, status: { type: String, default: 'pending', index: true },
}, opts);
export const Reseller = mongoose.models.Reseller || mongoose.model('Reseller', resellerSchema);

const sellerResellerSchema = new mongoose.Schema({
  sellerId: { type: String, unique: true, sparse: true, index: true },
  status: { type: String, default: 'active', index: true }, createdBy: String, updatedBy: String,
}, opts);
export const SellerReseller = mongoose.models.SellerReseller || mongoose.model('SellerReseller', sellerResellerSchema);

const whiteLabelInstanceSchema = new mongoose.Schema({
  instanceId: { type: String, unique: true, sparse: true, index: true },
  name: String, owner: { type: oid, ref: 'User', index: true }, partner: { type: oid, ref: 'Partner' },
  branding: Mixed, config: Mixed, metrics: Mixed, status: { type: String, default: 'pending', index: true },
}, opts);
export const WhiteLabelInstance = mongoose.models.WhiteLabelInstance || mongoose.model('WhiteLabelInstance', whiteLabelInstanceSchema);

const currencyRateSchema = new mongoose.Schema({
  fromCurrency: { type: String, index: true }, toCurrency: { type: String, index: true },
  rate: Number, source: { type: String, default: 'manual' },
}, opts);
export const CurrencyRate = mongoose.models.CurrencyRate || mongoose.model('CurrencyRate', currencyRateSchema);

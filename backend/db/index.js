import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI environment variable is not set");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS:          45000,
    retryWrites:              true,
    w:                        "majority",
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Disconnected — Mongoose will auto-reconnect");
  });
  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Reconnected");
  });
  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  console.log("MongoDB connected →", mongoose.connection.host);
}

// ── User ──────────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role:         { type: String, enum: ["user", "admin", "telecom", "law_enforcement"], default: "user" },
  phone:        { type: String },          // e.g. +254712345678 for Africa's Talking SMS
  apiKey:       { type: String, index: true, sparse: true },
  createdAt:    { type: Date, default: Date.now },
});
export const User = mongoose.model("User", userSchema);

// ── Device ────────────────────────────────────────────────────────────────────
const deviceSchema = new mongoose.Schema({
  imei:         { type: String, required: true, unique: true, index: true },
  serialNumber: { type: String },
  make:         { type: String },
  model:        { type: String },
  owner:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status:       { type: String, enum: ["active", "stolen", "recovered", "blacklisted"], default: "active" },
  deviceKey:    { type: String, index: true, sparse: true }, // HMAC secret for /api/track auth
  // Device DNA fingerprint
  fingerprint: {
    networkMac:   String,
    bluetoothMac: String,
    screenRes:    String,
    osVersion:    String,
    buildId:      String,
  },
  lastSeen:  Date,
  createdAt: { type: Date, default: Date.now },
});
deviceSchema.index({ owner: 1, status: 1 });    // user device list + status filter
deviceSchema.index({ status: 1 });              // admin all-devices by status
export const Device = mongoose.model("Device", deviceSchema);

// ── Location ping ─────────────────────────────────────────────────────────────
const pingSchema = new mongoose.Schema({
  imei:      { type: String, required: true, index: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  accuracy:  Number,
  simIccid:  String,        // track SIM swaps
  networkOp: String,        // carrier name
  ipAddress: String,
  verified:  { type: Boolean, default: false }, // true = X-Device-Key matched
  imageUrl:  { type: String },                   // evidence photo URL (S3/Cloudinary)
  ts:        { type: Date, default: Date.now, index: true },
});
pingSchema.index({ imei: 1, ts: -1 });
pingSchema.index({ imei: 1, simIccid: 1 });    // SIM swap detection
export const Ping = mongoose.model("Ping", pingSchema);

// ── Theft report ──────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  imei:         { type: String, required: true, index: true },
  reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  description:  String,
  policeRef:    String,
  status:       { type: String, enum: ["open", "investigating", "recovered", "closed"], default: "open" },
  createdAt:    { type: Date, default: Date.now },
  resolvedAt:   Date,
});
export const TheftReport = mongoose.model("TheftReport", reportSchema);

// ── Alert ─────────────────────────────────────────────────────────────────────
const alertSchema = new mongoose.Schema({
  imei:    { type: String, required: true, index: true },
  type:      { type: String, enum: ["blacklist_ping", "sim_swap", "location_jump", "fraud_pattern", "theft_report"], required: true },
  payload:   mongoose.Schema.Types.Mixed,
  narrative: { type: String },   // AI-generated plain-English description
  read:      { type: Boolean, default: false },
  ts:      { type: Date, default: Date.now },
});
alertSchema.index({ imei: 1, ts: -1 });
alertSchema.index({ read: 1, ts: -1 });         // dashboard unread count
export const Alert = mongoose.model("Alert", alertSchema);

// ────────────────────────────────────────────────────────────────────────────
// MONETISATION SCHEMAS
// ────────────────────────────────────────────────────────────────────────────

// ── Plan / Tier definition (seeded at startup) ────────────────────────────────
const planSchema = new mongoose.Schema({
  id:           { type: String, unique: true },   // "free" | "pro" | "business" | "enterprise"
  name:         String,
  priceKES:     Number,                            // monthly price in KES (0 = free)
  priceUSD:     Number,
  deviceLimit:  Number,                            // max devices (999 = unlimited)
  extraDeviceKES: Number,                          // per extra device beyond limit
  features:     [String],
  imeiChecksPerDay: Number,                        // 0 = unlimited
  aiReportsPerMonth: Number,
  slaHours:     Number,                            // response SLA for telecom tier
});
export const Plan = mongoose.model("Plan", planSchema);

// ── User subscription ─────────────────────────────────────────────────────────
const subscriptionSchema = new mongoose.Schema({
  user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },
  plan:           { type: String, default: "free" },
  status:         { type: String, enum: ["active", "past_due", "cancelled", "trialing"], default: "active" },
  currentPeriodEnd: Date,
  stripeSubId:    String,
  mpesaPhone:     String,
  extraDevices:   { type: Number, default: 0 },    // paid extra slots beyond plan limit
  createdAt:      { type: Date, default: Date.now },
  updatedAt:      { type: Date, default: Date.now },
});
export const Subscription = mongoose.model("Subscription", subscriptionSchema);

// ── Payment / Invoice record ──────────────────────────────────────────────────
const paymentSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type:       { type: String, enum: ["subscription", "extra_device", "imei_check", "api_call"] },
  amountKES:  Number,
  amountUSD:  Number,
  method:     { type: String, enum: ["mpesa", "stripe", "bank", "free"] },
  status:     { type: String, enum: ["pending", "completed", "failed", "refunded"], default: "pending" },
  reference:  String,                              // M-Pesa CheckoutRequestID or Stripe PaymentIntent
  mpesaReceipt: String,
  description: String,
  paidAt:     Date,
  createdAt:  { type: Date, default: Date.now },
});
export const Payment = mongoose.model("Payment", paymentSchema);

// ── Advertisement ─────────────────────────────────────────────────────────────
const adSchema = new mongoose.Schema({
  advertiser:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title:        { type: String, required: true, maxlength: 80 },
  body:         { type: String, required: true, maxlength: 200 },
  ctaText:      { type: String, default: "Learn More" },
  ctaUrl:       { type: String, required: true },
  imageUrl:     String,
  placement:    { type: String, enum: ["dashboard_banner", "imei_sidebar", "devices_footer", "alert_feed"], default: "dashboard_banner" },
  targetRoles:  [{ type: String }],               // [] = all users
  targetPlans:  [{ type: String }],               // [] = all plans (usually free)
  budgetKES:    { type: Number, required: true },
  spentKES:     { type: Number, default: 0 },
  cpcKES:       { type: Number, default: 5 },     // cost per click in KES
  impressions:  { type: Number, default: 0 },
  clicks:       { type: Number, default: 0 },
  status:       { type: String, enum: ["pending", "active", "paused", "exhausted", "rejected"], default: "pending" },
  startDate:    Date,
  endDate:      Date,
  createdAt:    { type: Date, default: Date.now },
});
export const Ad = mongoose.model("Ad", adSchema);

// ── Telecom / Agency partner ──────────────────────────────────────────────────
const partnerSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  orgName:       { type: String, required: true },
  orgType:       { type: String, enum: ["telecom", "law_enforcement", "marketplace", "insurance"], required: true },
  country:       { type: String, default: "KE" },
  apiKey:        { type: String, unique: true, index: true },
  webhookUrl:    String,                           // SimTrace pushes blacklist/recovery events here
  webhookSecret: String,
  tier:          { type: String, enum: ["basic", "standard", "premium"], default: "basic" },
  // Usage tracking
  apiCallsMonth: { type: Number, default: 0 },
  apiCallsLimit: { type: Number, default: 1000 },  // per month
  lastReset:     { type: Date, default: Date.now },
  status:        { type: String, enum: ["pending", "active", "suspended"], default: "pending" },
  createdAt:     { type: Date, default: Date.now },
});
export const Partner = mongoose.model("Partner", partnerSchema);

// ── Ad click / impression event ───────────────────────────────────────────────
const adEventSchema = new mongoose.Schema({
  ad:       { type: mongoose.Schema.Types.ObjectId, ref: "Ad" },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type:     { type: String, enum: ["impression", "click"] },
  ip:       String,
  ts:       { type: Date, default: Date.now },
});
adEventSchema.index({ ad: 1, ts: -1 });
export const AdEvent = mongoose.model("AdEvent", adEventSchema);

// Password reset tokens
const resetSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token:     { type: String, required: true, unique: true },
  expiresAt: { type: Date,   required: true },
  used:      { type: Boolean, default: false },
});
resetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete after expiry
export const PasswordReset = mongoose.model("PasswordReset", resetSchema);


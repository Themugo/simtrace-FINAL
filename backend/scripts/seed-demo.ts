// scripts/seed-demo.ts — Run once: node scripts/seed-demo.ts
// Creates a fully operational demo environment for SimTrace
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// ── Production guard ──────────────────────────────────────────────────────────
// This script creates demo users (including admin / super_admin roles) and must
// never run against a production database. Override only if you truly mean to.
if (process.env.NODE_ENV === "production" && process.env.SEED_ALLOW_PRODUCTION !== "true") {
  console.error("\n✋ Refusing to run the demo seed: NODE_ENV=production.");
  console.error("   This creates demo/admin accounts and is intended for dev/staging only.");
  console.error("   If you really intend to seed production, re-run with SEED_ALLOW_PRODUCTION=true.\n");
  process.exit(1);
}

// ── Seed credentials (from env; secure random per-run fallback) ────────────────
// Set SEED_ADMIN_PASSWORD / SEED_SUPERADMIN_PASSWORD / SEED_DEMO_PASSWORD /
// SEED_TELECOM_PASSWORD / SEED_LAW_PASSWORD to control these. If unset, a strong
// random password is generated for that account and printed ONCE at the end.
const generatedCreds: string[] = [];
function seedPassword(envName: string): string {
  const v = process.env[envName];
  if (v && v.length >= 8) return v;
  const gen = crypto.randomBytes(18).toString("base64url");
  generatedCreds.push(`${envName}=${gen}`);
  return gen;
}
const PW = {
  admin:      seedPassword("SEED_ADMIN_PASSWORD"),
  superAdmin: seedPassword("SEED_SUPERADMIN_PASSWORD"),
  demo:       seedPassword("SEED_DEMO_PASSWORD"),
  telecom:    seedPassword("SEED_TELECOM_PASSWORD"),
  law:        seedPassword("SEED_LAW_PASSWORD"),
};
const SUPERADMIN_EMAIL = process.env.SEED_SUPERADMIN_EMAIL || "mugo.james27@gmail.com";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/simtrace";

// ── Inline minimal models (avoid circular service imports) ────────────────────
await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");

const User         = mongoose.model("User",         mongoose.models.User?.schema         || new mongoose.Schema({ name:String, email:{type:String,unique:true}, passwordHash:String, role:String, phone:String, apiKey:String, createdAt:{type:Date,default:Date.now} }));
const Device       = mongoose.model("Device",       mongoose.models.Device?.schema       || new mongoose.Schema({ imei:{type:String,unique:true}, make:String, model:String, owner:mongoose.Schema.Types.ObjectId, status:{type:String,default:"active"}, lastSeen:Date, fingerprint:Object, createdAt:{type:Date,default:Date.now} }));
const Ping         = mongoose.model("Ping",         mongoose.models.Ping?.schema         || new mongoose.Schema({ imei:String, lat:Number, lng:Number, simIccid:String, networkOp:String, ipAddress:String, ts:{type:Date,default:Date.now} }));
const Alert        = mongoose.model("Alert",        mongoose.models.Alert?.schema        || new mongoose.Schema({ imei:String, type:String, payload:Object, narrative:String, read:{type:Boolean,default:false}, ts:{type:Date,default:Date.now} }));
const TheftReport  = mongoose.model("TheftReport",  mongoose.models.TheftReport?.schema  || new mongoose.Schema({ imei:String, reportedBy:mongoose.Schema.Types.ObjectId, description:String, policeRef:String, status:{type:String,default:"open"}, createdAt:{type:Date,default:Date.now} }));
const Subscription = mongoose.model("Subscription", mongoose.models.Subscription?.schema || new mongoose.Schema({ user:mongoose.Schema.Types.ObjectId, plan:{type:String,default:"free"}, status:{type:String,default:"active"}, extraDevices:{type:Number,default:0}, currentPeriodEnd:Date, createdAt:{type:Date,default:Date.now} }));
const Payment      = mongoose.model("Payment",      mongoose.models.Payment?.schema      || new mongoose.Schema({ user:mongoose.Schema.Types.ObjectId, type:String, amountKES:Number, amountUSD:Number, method:String, status:{type:String,default:"completed"}, description:String, reference:String, paidAt:Date, createdAt:{type:Date,default:Date.now} }));
const Partner      = mongoose.model("Partner",      mongoose.models.Partner?.schema      || new mongoose.Schema({ user:mongoose.Schema.Types.ObjectId, orgName:String, orgType:String, country:{type:String,default:"KE"}, apiKey:String, webhookUrl:String, tier:{type:String,default:"standard"}, apiCallsMonth:{type:Number,default:0}, apiCallsLimit:{type:Number,default:10000}, status:{type:String,default:"active"}, createdAt:{type:Date,default:Date.now} }));
const Ad           = mongoose.model("Ad",           mongoose.models.Ad?.schema           || new mongoose.Schema({ advertiser:mongoose.Schema.Types.ObjectId, title:String, body:String, ctaText:String, ctaUrl:String, imageUrl:String, placement:String, budgetKES:Number, spentKES:{type:Number,default:0}, cpcKES:{type:Number,default:5}, impressions:{type:Number,default:0}, clicks:{type:Number,default:0}, status:{type:String,default:"active"}, createdAt:{type:Date,default:Date.now} }));
const Plan         = mongoose.model("Plan",         mongoose.models.Plan?.schema         || new mongoose.Schema({ id:{type:String,unique:true}, name:String, priceKES:Number, priceUSD:Number, deviceLimit:Number, extraDeviceKES:Number, features:[String], imeiChecksPerDay:Number, aiReportsPerMonth:Number, slaHours:Number }));

// ── Helper ────────────────────────────────────────────────────────────────────
const rand = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
function apiKey() { return "st_" + crypto.randomBytes(28).toString("hex"); }
function imei()   { return String(Math.floor(Math.random() * 9e14 + 1e14)); }

// ── Seed Plans ────────────────────────────────────────────────────────────────
const PLANS = [
  { id:"free",       name:"Free",       priceKES:0,    priceUSD:0,  deviceLimit:2,   extraDeviceKES:150, features:["2 devices","Basic IMEI checks","Email alerts"],                                          imeiChecksPerDay:5,  aiReportsPerMonth:3,  slaHours:null },
  { id:"pro",        name:"Pro",        priceKES:799,  priceUSD:6,  deviceLimit:10,  extraDeviceKES:80,  features:["10 devices","Unlimited IMEI checks","SMS alerts","AI reports","No ads"],                 imeiChecksPerDay:0,  aiReportsPerMonth:50, slaHours:24   },
  { id:"business",   name:"Business",   priceKES:3499, priceUSD:27, deviceLimit:50,  extraDeviceKES:50,  features:["50 devices","Unlimited everything","Marketplace API","Webhooks","Dedicated manager"],    imeiChecksPerDay:0,  aiReportsPerMonth:0,  slaHours:4    },
  { id:"enterprise", name:"Enterprise", priceKES:0,    priceUSD:0,  deviceLimit:999, extraDeviceKES:0,   features:["Unlimited devices","Full API","Bulk IMEI","Custom SLA","Law enforcement portal"],         imeiChecksPerDay:0,  aiReportsPerMonth:0,  slaHours:1    },
];
for (const p of PLANS) await Plan.findOneAndUpdate({ id: p.id }, p, { upsert: true });
console.log("✅ Plans seeded");

// ── Create accounts ───────────────────────────────────────────────────────────
const hash = (pw: string) => bcrypt.hash(pw, 12);

// Admin
const adminUser = await User.findOneAndUpdate(
  { email: "admin@simtrace.site" },
  { name: "SimTrace Admin", email: "admin@simtrace.site", passwordHash: await hash(PW.admin), role: "admin", phone: "+254712000001" },
  { upsert: true, new: true }
);
await Subscription.findOneAndUpdate({ user: adminUser._id }, { plan: "enterprise", status: "active" }, { upsert: true });
console.log("✅ Admin: admin@simtrace.site");

// Super Admin (Owner)
const superAdminUser = await User.findOneAndUpdate(
  { email: SUPERADMIN_EMAIL },
  { name: "Mugo James", email: SUPERADMIN_EMAIL, passwordHash: await hash(PW.superAdmin), role: "super_admin", phone: "+254700000000" },
  { upsert: true, new: true }
);
await Subscription.findOneAndUpdate({ user: superAdminUser._id }, { plan: "enterprise", status: "active" }, { upsert: true });
console.log(`✅ Super Admin: ${SUPERADMIN_EMAIL}`);

// Demo user (Pro)
const proUser = await User.findOneAndUpdate(
  { email: "jane@demo.simtrace.site" },
  { name: "Jane Kamau", email: "jane@demo.simtrace.site", passwordHash: await hash(PW.demo), role: "user", phone: "+254722334455" },
  { upsert: true, new: true }
);
await Subscription.findOneAndUpdate({ user: proUser._id }, { plan: "pro", status: "active", currentPeriodEnd: new Date(Date.now() + 30*86400000) }, { upsert: true });
await Payment.findOneAndUpdate({ user: proUser._id, type: "subscription" }, { user: proUser._id, type: "subscription", amountKES: 799, method: "mpesa", status: "completed", description: "SimTrace Pro - 1 month", reference: "QHX2Y8KL9Z", paidAt: new Date(Date.now() - 15*86400000) }, { upsert: true });
console.log("✅ Pro user: jane@demo.simtrace.site");

// Free user (2 devices + 1 extra)
const freeUser = await User.findOneAndUpdate(
  { email: "john@demo.simtrace.site" },
  { name: "John Otieno", email: "john@demo.simtrace.site", passwordHash: await hash(PW.demo), role: "user", phone: "+254733556677" },
  { upsert: true, new: true }
);
await Subscription.findOneAndUpdate({ user: freeUser._id }, { plan: "free", status: "active", extraDevices: 1 }, { upsert: true });
await Payment.findOneAndUpdate({ user: freeUser._id, type: "extra_device" }, { user: freeUser._id, type: "extra_device", amountKES: 150, method: "mpesa", status: "completed", description: "Extra device slot", reference: "LMN7P3QR4S", paidAt: new Date(Date.now() - 3*86400000) }, { upsert: true });
console.log("✅ Free user: john@demo.simtrace.site");

// Telecom partner user
const telecomUser = await User.findOneAndUpdate(
  { email: "api@safaricom-demo.simtrace.site" },
  { name: "Safaricom API", email: "api@safaricom-demo.simtrace.site", passwordHash: await hash(PW.telecom), role: "telecom", phone: "+254722000001" },
  { upsert: true, new: true }
);
const partnerKey = apiKey();
await Partner.findOneAndUpdate(
  { user: telecomUser._id },
  { user: telecomUser._id, orgName: "Safaricom PLC (Demo)", orgType: "telecom", country: "KE", apiKey: partnerKey, tier: "premium", apiCallsMonth: 4827, apiCallsLimit: 100000, status: "active" },
  { upsert: true }
);
await Subscription.findOneAndUpdate({ user: telecomUser._id }, { plan: "enterprise", status: "active" }, { upsert: true });
console.log(`✅ Telecom partner: ${partnerKey.slice(0,20)}…`);

// Law enforcement
const lawUser = await User.findOneAndUpdate(
  { email: "dci@demo.simtrace.site" },
  { name: "DCI Kenya (Demo)", email: "dci@demo.simtrace.site", passwordHash: await hash(PW.law), role: "law_enforcement" },
  { upsert: true, new: true }
);
const lawKey = apiKey();
await Partner.findOneAndUpdate(
  { user: lawUser._id },
  { user: lawUser._id, orgName: "DCI Kenya (Demo)", orgType: "law_enforcement", country: "KE", apiKey: lawKey, tier: "premium", apiCallsMonth: 312, apiCallsLimit: 50000, status: "active" },
  { upsert: true }
);
console.log("✅ Law enforcement: dci@demo.simtrace.site");

// ── Devices ───────────────────────────────────────────────────────────────────
const DEVICES_DATA = [
  // Jane's devices (Pro)
  { imei: "356938035643809", make: "Samsung", model: "Galaxy S24 Ultra", owner: proUser._id,  status: "active"      },
  { imei: "490154203237518", make: "Apple",   model: "iPhone 15 Pro",    owner: proUser._id,  status: "active"      },
  { imei: "012345678901234", make: "Tecno",   model: "Spark 20 Pro",     owner: proUser._id,  status: "active"      },
  // John's devices (Free + 1 extra paid)
  { imei: "352098109100244", make: "Infinix", model: "Hot 40",           owner: freeUser._id, status: "active"      },
  { imei: "867400021091512", make: "Samsung", model: "Galaxy A35",       owner: freeUser._id, status: "active"      },
  { imei: "354803112467604", make: "Xiaomi",  model: "Redmi Note 13",    owner: freeUser._id, status: "active"      },
  // Stolen / blacklisted devices (no owner — reported)
  { imei: "111222333444555", make: "Apple",   model: "iPhone 14",        owner: proUser._id,  status: "stolen"      },
  { imei: "999888777666555", make: "Samsung", model: "Galaxy A54",       owner: proUser._id, status: "blacklisted"  },
  { imei: "444333222111000", make: "Tecno",   model: "Pop 8",            owner: null,         status: "stolen"      },
  // Recovered
  { imei: "321654987654321", make: "Apple",   model: "iPhone 13",        owner: proUser._id,  status: "recovered"   },
];

const createdDevices = [];
for (const d of DEVICES_DATA) {
  const deviceKey = crypto.randomBytes(32).toString("hex");
  const dev = await Device.findOneAndUpdate(
    { imei: d.imei },
    { ...d, lastSeen: new Date(Date.now() - Math.random() * 3600000), deviceKey },
    { upsert: true, new: true }
  );
  createdDevices.push(dev);
}
console.log(`✅ ${DEVICES_DATA.length} devices seeded`);

// ── Theft Reports ─────────────────────────────────────────────────────────────
await TheftReport.findOneAndUpdate(
  { imei: "111222333444555" },
  { imei: "111222333444555", reportedBy: proUser._id, description: "Stolen at Westgate Mall parking, Nairobi on 2024-11-15", policeRef: "OB/4721/2024", status: "investigating" },
  { upsert: true }
);
await TheftReport.findOneAndUpdate(
  { imei: "999888777666555" },
  { imei: "999888777666555", reportedBy: freeUser._id, description: "Snatched from hand in Kenyatta Avenue matatu", policeRef: "OB/5102/2024", status: "open" },
  { upsert: true }
);
await TheftReport.findOneAndUpdate(
  { imei: "444333222111000" },
  { imei: "444333222111000", reportedBy: proUser._id, description: "Taken during robbery at Ngong Road", policeRef: "OB/4998/2024", status: "open" },
  { upsert: true }
);
await TheftReport.findOneAndUpdate(
  { imei: "321654987654321" },
  { imei: "321654987654321", reportedBy: proUser._id, description: "Stolen from house in Kilimani", status: "recovered", resolvedAt: new Date(Date.now() - 5*86400000) },
  { upsert: true }
);
console.log("✅ Theft reports seeded");

// ── Location pings (last 4 hours, Nairobi + surrounds) ───────────────────────
const NAIROBI_BOUNDS = { lat: { min: -1.40, max: -1.18 }, lng: { min: 36.72, max: 36.92 } };
const CARRIERS = ["Safaricom", "Airtel", "Telkom", "Faiba"];
const SIMS = ["8954030000012345", "8954030000067890", "8954030000099001", "8954030000045678"];

const activeImeis = createdDevices.filter(d => d.status === "active" || d.status === "stolen" || d.status === "blacklisted").map(d => d.imei);

await Ping.deleteMany({ imei: { $in: activeImeis } });

for (const deviceImei of activeImeis) {
  const pingCount = Math.floor(Math.random() * 25) + 10;
  let lat = NAIROBI_BOUNDS.lat.min + Math.random() * (NAIROBI_BOUNDS.lat.max - NAIROBI_BOUNDS.lat.min);
  let lng = NAIROBI_BOUNDS.lng.min + Math.random() * (NAIROBI_BOUNDS.lng.max - NAIROBI_BOUNDS.lng.min);
  const carrier = rand(CARRIERS);
  const simIccid = rand(SIMS);

  for (let i = 0; i < pingCount; i++) {
    lat += (Math.random() - 0.5) * 0.008;
    lng += (Math.random() - 0.5) * 0.008;
    lat = Math.max(NAIROBI_BOUNDS.lat.min, Math.min(NAIROBI_BOUNDS.lat.max, lat));
    lng = Math.max(NAIROBI_BOUNDS.lng.min, Math.min(NAIROBI_BOUNDS.lng.max, lng));

    // Inject SIM swap for stolen device
    const useSim = (deviceImei === "111222333444555" && i === 8) ? "8954030000099999" : simIccid;
    const useCarrier = (deviceImei === "999888777666555" && i > 10) ? rand(CARRIERS.filter(c => c !== carrier)) : carrier;

    await Ping.create({
      imei:      deviceImei,
      lat,
      lng,
      accuracy:  Math.floor(Math.random() * 30) + 5,
      simIccid:  useSim,
      networkOp: useCarrier,
      ipAddress: `102.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      ts:        new Date(Date.now() - (pingCount - i) * (4 * 3600000 / pingCount)),
    });
  }
}
console.log("✅ Location pings seeded");

// ── Alerts ────────────────────────────────────────────────────────────────────
await Alert.deleteMany({});
const ALERT_TEMPLATES = [
  { imei: "111222333444555", type: "blacklist_ping",  payload: { lat: -1.286, lng: 36.817 }, narrative: "Blacklisted iPhone 14 detected at Westgate Mall, Nairobi. Device was reported stolen (OB/4721/2024). Last carrier: Safaricom.", read: false },
  { imei: "111222333444555", type: "sim_swap",         payload: { oldSim: "8954030000012345", newSim: "8954030000099999" }, narrative: "SIM card replaced in stolen iPhone 14. Original Safaricom SIM swapped for an unregistered SIM, likely to avoid tracking.", read: false },
  { imei: "999888777666555", type: "blacklist_ping",  payload: { lat: -1.292, lng: 36.826 }, narrative: "Blacklisted Galaxy A54 pinged from CBD Nairobi. Device flagged after Kenyatta Avenue robbery. Active on Airtel network.", read: false },
  { imei: "999888777666555", type: "fraud_pattern",   payload: { operators: ["Safaricom", "Airtel", "Telkom"] }, narrative: "Carrier-hop fraud detected on Galaxy A54 — 3 different network operators used within 1 hour, consistent with IMEI cloning attempt.", read: false },
  { imei: "444333222111000", type: "location_jump",   payload: { kmh: 842, from: [-1.30, 36.82], to: [-1.17, 36.75] }, narrative: "Impossible movement at 842 km/h on Tecno Pop 8. Likely multiple devices sharing cloned IMEI across Nairobi/Thika corridor.", read: true },
  { imei: "356938035643809", type: "sim_swap",         payload: { oldSim: "8954030000067890", newSim: "8954030000045678" }, narrative: "SIM change detected on Jane Kamau's Samsung S24 Ultra. Switched from Safaricom to Airtel. Owner verified as intentional.", read: true },
  { imei: "352098109100244", type: "blacklist_ping",  payload: { lat: -1.31, lng: 36.83 }, narrative: "Registered Infinix Hot 40 matching a prior blacklist check pattern.", read: true },
];

for (const a of ALERT_TEMPLATES) {
  await Alert.create({ ...a, ts: new Date(Date.now() - Math.random() * 12 * 3600000) });
}
console.log("✅ Alerts seeded");

// ── Ads ───────────────────────────────────────────────────────────────────────
await Ad.deleteMany({});
const ADS_DATA = [
  { title: "Insure Your Phone with CoverKe", body: "Get IMEI-linked device insurance from just KES 99/month. Claims processed in 24h. Covers theft, loss, and damage.", ctaText: "Get Covered", ctaUrl: "https://example.com", placement: "imei_sidebar",      budgetKES: 10000, spentKES: 2340, cpcKES: 5,  impressions: 4821, clicks: 468 },
  { title: "Buy & Sell Phones Safely on Jiji", body: "Every listing on Jiji now verified with SimTrace IMEI check. Buy with confidence, sell faster.", ctaText: "Browse Phones", ctaUrl: "https://example.com", placement: "dashboard_banner", budgetKES: 25000, spentKES: 8750, cpcKES: 10, impressions: 9200, clicks: 875 },
  { title: "Safaricom Device Protection Plan", body: "Add device theft protection to your Safaricom line. Automatic IMEI blacklisting + KES 15,000 recovery guarantee.", ctaText: "Activate Now", ctaUrl: "https://example.com", placement: "devices_footer",   budgetKES: 50000, spentKES: 5200, cpcKES: 8,  impressions: 6540, clicks: 650 },
  { title: "SimTrace Business API — Free Trial", body: "Verify 1,000 IMEIs free. No credit card. Instant setup for telecoms, insurers & marketplaces.", ctaText: "Start Free Trial", ctaUrl: "https://example.com", placement: "alert_feed", budgetKES: 8000, spentKES: 1200, cpcKES: 6,  impressions: 2100, clicks: 200 },
];
for (const ad of ADS_DATA) {
  await Ad.create({ ...ad, advertiser: adminUser._id, status: "active" });
}
console.log("✅ Ads seeded");

// ── Revenue payments ──────────────────────────────────────────────────────────
const PAYMENTS = [
  { user: proUser._id,  type: "subscription", amountKES: 799,  method: "mpesa",  description: "Pro plan - December", paidAt: new Date("2024-12-01") },
  { user: proUser._id,  type: "subscription", amountKES: 799,  method: "mpesa",  description: "Pro plan - November", paidAt: new Date("2024-11-01") },
  { user: freeUser._id, type: "extra_device",  amountKES: 150,  method: "mpesa",  description: "Extra device slot",   paidAt: new Date("2024-12-10") },
  { user: freeUser._id, type: "subscription",  amountKES: 799,  method: "stripe", description: "Pro plan trial",      paidAt: new Date("2024-10-01") },
  { user: adminUser._id,type: "api_call",       amountKES: 4999, method: "bank",   description: "Enterprise API Q4",   paidAt: new Date("2024-12-05") },
  { user: adminUser._id,type: "subscription",   amountKES: 3499, method: "mpesa",  description: "Business plan - Dec", paidAt: new Date("2024-12-01") },
  { user: telecomUser._id, type: "api_call",    amountKES: 24999, method: "bank",  description: "Telecom API premium - Dec", paidAt: new Date("2024-12-01") },
  { user: telecomUser._id, type: "api_call",    amountKES: 24999, method: "bank",  description: "Telecom API premium - Nov", paidAt: new Date("2024-11-01") },
];
for (const p of PAYMENTS) {
  await Payment.create({ ...p, status: "completed", reference: "DEMO-" + Math.random().toString(36).slice(2,10).toUpperCase(), createdAt: p.paidAt });
}
console.log("✅ Payments seeded");

// ── Summary ───────────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════════════");
console.log("  SIMTRACE DEMO SEED COMPLETE");
console.log("═══════════════════════════════════════════════════════");
console.log(`  Super Admin: ${SUPERADMIN_EMAIL}`);
console.log("  Admin:       admin@simtrace.site");
console.log("  Pro user:    jane@demo.simtrace.site");
console.log("  Free user:   john@demo.simtrace.site");
console.log("  Telecom:     api@safaricom-demo.simtrace.site");
console.log("  Law:         dci@demo.simtrace.site");
console.log("═══════════════════════════════════════════════════════");
console.log(`  Devices: ${DEVICES_DATA.length} | Alerts: ${ALERT_TEMPLATES.length} | Ads: ${ADS_DATA.length}`);
console.log("═══════════════════════════════════════════════════════\n");

if (generatedCreds.length) {
  console.log("  ⚠  Auto-generated passwords for this run (shown ONCE — store securely):");
  for (const c of generatedCreds) console.log("     " + c);
  console.log("     Set the matching SEED_*_PASSWORD env vars to use fixed passwords instead.");
} else {
  console.log("  Passwords were taken from SEED_*_PASSWORD environment variables.");
}
console.log("═══════════════════════════════════════════════════════\n");

await mongoose.disconnect();
process.exit(0);

import { connectDB, Device, Ping, Alert, User, Subscription, TheftReport, Payment, Ad, Partner, AdEvent } from '../db/index.js';

async function optimizeIndexes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Device collection indexes
    await Device.collection.createIndex({ imei: 1 }, { unique: true });
    await Device.collection.createIndex({ owner: 1 });
    await Device.collection.createIndex({ owner: 1, status: 1, lastSeen: -1 });
    await Device.collection.createIndex({ status: 1, lastSeen: -1 });
    await Device.collection.createIndex({ imei: 1, status: 1 });
    await Device.collection.createIndex({ deviceKey: 1 }, { sparse: true });
    await Device.collection.createIndex({ createdAt: -1 });
    await Device.collection.createIndex({ lastSeen: -1 });
    console.log('✅ Device indexes optimized');

    // Ping collection indexes
    await Ping.collection.createIndex({ imei: 1, ts: -1 });
    await Ping.collection.createIndex({ imei: 1, simIccid: 1, ts: -1 });
    await Ping.collection.createIndex({ ts: -1 });
    await Ping.collection.createIndex({ verified: 1, ts: -1 });
    await Ping.collection.createIndex({ imei: 1 });
    console.log('✅ Ping indexes optimized');

    // Alert collection indexes
    await Alert.collection.createIndex({ imei: 1, ts: -1 });
    await Alert.collection.createIndex({ read: 1, ts: -1 });
    await Alert.collection.createIndex({ type: 1, ts: -1 });
    await Alert.collection.createIndex({ imei: 1, read: 1 });
    await Alert.collection.createIndex({ imei: 1 });
    await Alert.collection.createIndex({ ts: -1 });
    console.log('✅ Alert indexes optimized');

    // User collection indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1, createdAt: -1 });
    await User.collection.createIndex({ apiKey: 1 }, { sparse: true });
    await User.collection.createIndex({ createdAt: -1 });
    console.log('✅ User indexes optimized');

    // Subscription collection indexes
    await Subscription.collection.createIndex({ user: 1 }, { unique: true });
    await Subscription.collection.createIndex({ status: 1, currentPeriodEnd: -1 });
    await Subscription.collection.createIndex({ plan: 1, status: 1 });
    await Subscription.collection.createIndex({ user: 1, status: 1 });
    console.log('✅ Subscription indexes optimized');

    // TheftReport collection indexes
    await TheftReport.collection.createIndex({ imei: 1 });
    await TheftReport.collection.createIndex({ reportedBy: 1, createdAt: -1 });
    await TheftReport.collection.createIndex({ status: 1, createdAt: -1 });
    await TheftReport.collection.createIndex({ imei: 1, status: 1 });
    console.log('✅ TheftReport indexes optimized');

    // Payment collection indexes
    await Payment.collection.createIndex({ user: 1, createdAt: -1 });
    await Payment.collection.createIndex({ status: 1, createdAt: -1 });
    await Payment.collection.createIndex({ type: 1, status: 1 });
    await Payment.collection.createIndex({ reference: 1 }, { sparse: true });
    await Payment.collection.createIndex({ createdAt: -1 });
    console.log('✅ Payment indexes optimized');

    // Ad collection indexes
    await Ad.collection.createIndex({ advertiser: 1, status: 1 });
    await Ad.collection.createIndex({ status: 1, startDate: 1, endDate: 1 });
    await Ad.collection.createIndex({ placement: 1, status: 1 });
    await Ad.collection.createIndex({ targetRoles: 1, status: 1 });
    await Ad.collection.createIndex({ createdAt: -1 });
    console.log('✅ Ad indexes optimized');

    // Partner collection indexes
    await Partner.collection.createIndex({ apiKey: 1 }, { unique: true });
    await Partner.collection.createIndex({ user: 1 });
    await Partner.collection.createIndex({ status: 1, tier: 1 });
    await Partner.collection.createIndex({ orgType: 1, country: 1 });
    await Partner.collection.createIndex({ createdAt: -1 });
    console.log('✅ Partner indexes optimized');

    // AdEvent collection indexes
    await AdEvent.collection.createIndex({ ad: 1, ts: -1 });
    await AdEvent.collection.createIndex({ user: 1, ts: -1 });
    await AdEvent.collection.createIndex({ type: 1, ts: -1 });
    await AdEvent.collection.createIndex({ ip: 1, ts: -1 });
    console.log('✅ AdEvent indexes optimized');

    console.log('\n🎉 All indexes optimized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error);
    process.exit(1);
  }
}

optimizeIndexes();

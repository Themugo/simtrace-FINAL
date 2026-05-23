import { connectDB, Device, Ping, Alert, User, Subscription } from '../db/index.js';

async function optimizeIndexes() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Device collection indexes
    await Device.collection.createIndex({ owner: 1, status: 1, lastSeen: -1 });
    await Device.collection.createIndex({ status: 1, lastSeen: -1 });
    await Device.collection.createIndex({ imei: 1, status: 1 });
    console.log('✅ Device indexes optimized');

    // Ping collection indexes
    await Ping.collection.createIndex({ imei: 1, ts: -1 });
    await Ping.collection.createIndex({ imei: 1, simIccid: 1, ts: -1 });
    await Ping.collection.createIndex({ ts: -1 });
    await Ping.collection.createIndex({ verified: 1, ts: -1 });
    console.log('✅ Ping indexes optimized');

    // Alert collection indexes
    await Alert.collection.createIndex({ imei: 1, ts: -1 });
    await Alert.collection.createIndex({ read: 1, ts: -1 });
    await Alert.collection.createIndex({ type: 1, ts: -1 });
    await Alert.collection.createIndex({ imei: 1, read: 1 });
    console.log('✅ Alert indexes optimized');

    // User collection indexes
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ role: 1, createdAt: -1 });
    await User.collection.createIndex({ apiKey: 1 }, { sparse: true });
    console.log('✅ User indexes optimized');

    // Subscription collection indexes
    await Subscription.collection.createIndex({ user: 1 });
    await Subscription.collection.createIndex({ status: 1, currentPeriodEnd: -1 });
    await Subscription.collection.createIndex({ plan: 1, status: 1 });
    console.log('✅ Subscription indexes optimized');

    console.log('\n🎉 All indexes optimized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error optimizing indexes:', error);
    process.exit(1);
  }
}

optimizeIndexes();

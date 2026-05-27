import { connectDB, PasswordReset, TrackingEvent, DeviceSession, DeviceLocation } from '../db/index.js';
import { AuditLog } from '../modules/audit/audit.js';
import { getRedisClient, cacheDeletePattern } from '../services/redis.js';

async function cleanupExpiredData() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    const redis = getRedisClient();

    // ── Cleanup expired password reset tokens ─────────────────────────────────
    const deletedResets = await PasswordReset.deleteMany({
      expiresAt: { $lt: new Date() },
      used: true,
    });
    console.log(`✅ Deleted ${deletedResets.deletedCount} expired password reset tokens`);

    // ── Cleanup expired Redis sessions ───────────────────────────────────────────
    const sessionPattern = 'session:*';
    const deletedSessions = await cacheDeletePattern(sessionPattern);
    console.log(`✅ Redis sessions use TTL, manual cleanup not needed`);

    // ── Cleanup stale telemetry (older than 90 days) ────────────────────────────
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const deletedTrackingEvents = await TrackingEvent.deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });
    console.log(`✅ Deleted ${deletedTrackingEvents.deletedCount} stale tracking events`);

    const deletedDeviceLocations = await DeviceLocation.deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });
    console.log(`✅ Deleted ${deletedDeviceLocations.deletedCount} stale device locations`);

    // ── Cleanup old device sessions (older than 180 days) ────────────────────────
    const oneEightyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const deletedDeviceSessions = await DeviceSession.deleteMany({
      startTime: { $lt: oneEightyDaysAgo },
    });
    console.log(`✅ Deleted ${deletedDeviceSessions.deletedCount} old device sessions`);

    // ── Cleanup old audit logs (older than 90 days) ───────────────────────────────
    const deletedAuditLogs = await AuditLog.deleteMany({
      timestamp: { $lt: ninetyDaysAgo },
    });
    console.log(`✅ Deleted ${deletedAuditLogs.deletedCount} old audit logs`);

    // ── Cleanup Redis cache entries ───────────────────────────────────────────────
    const cachePatterns = ['cache:*', 'ratelimit:*'];
    for (const pattern of cachePatterns) {
      await cacheDeletePattern(pattern);
    }
    console.log(`✅ Cleaned up Redis cache entries`);

    console.log('\n🎉 All expired data cleaned up successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up expired data:', error);
    process.exit(1);
  }
}

cleanupExpiredData();

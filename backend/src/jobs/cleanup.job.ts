import { UserSession } from "../models/userSession.model.js";
import { logger } from "../config/logger.js";

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await UserSession.deleteMany({ expiresAt: { $lt: new Date() } });
    logger.info(`[Job Cleanup] Purged ${result.deletedCount} expired user sessions.`);
    return result.deletedCount || 0;
  } catch (err: any) {
    logger.error(`[Job Cleanup] Error cleaning sessions: ${err.message}`);
    return 0;
  }
}

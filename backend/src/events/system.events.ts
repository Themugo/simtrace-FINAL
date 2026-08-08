import { createEvent, SimTraceEvent } from "./types.js";

export const SYSTEM_EVENT_TYPES = {
  HEALTH_CHECK: "SYSTEM_HEALTH_CHECK",
  BACKUP_COMPLETED: "SYSTEM_BACKUP_COMPLETED",
  FAILOVER_TRIGGERED: "SYSTEM_FAILOVER_TRIGGERED",
};

export function createSystemHealthEvent(status: string, details?: any): SimTraceEvent<{ status: string; details?: any }> {
  return createEvent(SYSTEM_EVENT_TYPES.HEALTH_CHECK, "system-monitor", { status, details }, "info");
}

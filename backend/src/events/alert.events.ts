import { createEvent, SimTraceEvent } from "./types.js";

export const ALERT_EVENT_TYPES = {
  CREATED: "ALERT_CREATED",
  ACKNOWLEDGED: "ALERT_ACKNOWLEDGED",
  RESOLVED: "ALERT_RESOLVED",
};

export function createAlertCreatedEvent(alertId: string, title: string, priority: "low" | "medium" | "high" | "critical"): SimTraceEvent<{ alertId: string; title: string; priority: string }> {
  return createEvent(
    ALERT_EVENT_TYPES.CREATED,
    "monitoring-service",
    { alertId, title, priority },
    priority === "critical" ? "critical" : priority === "high" ? "error" : "warning"
  );
}

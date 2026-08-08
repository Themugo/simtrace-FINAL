import { v4 as uuidv4 } from "uuid";

export type EventSeverity = "info" | "warning" | "error" | "critical";

export interface SimTraceEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
  payload: T;
  severity: EventSeverity;
}

export function createEvent<T>(
  eventType: string,
  source: string,
  payload: T,
  severity: EventSeverity = "info"
): SimTraceEvent<T> {
  return {
    eventId: `evt_${uuidv4()}`,
    eventType,
    timestamp: new Date().toISOString(),
    source,
    payload,
    severity,
  };
}

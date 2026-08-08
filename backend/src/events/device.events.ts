import { createEvent, SimTraceEvent } from "./types.js";

export const DEVICE_EVENT_TYPES = {
  LOCATION_UPDATED: "DEVICE_LOCATION_UPDATED",
  STATUS_CHANGED: "DEVICE_STATUS_CHANGED",
  SIM_CHANGED: "DEVICE_SIM_CHANGED",
  IMEI_CHANGED: "DEVICE_IMEI_CHANGED",
  RISK_ALERT: "DEVICE_RISK_ALERT",
  LOCK_TRIGGERED: "DEVICE_LOCK_TRIGGERED",
};

export interface DeviceLocationPayload {
  deviceId: string;
  imei?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  batteryLevel?: number;
}

export function createDeviceLocationEvent(payload: DeviceLocationPayload): SimTraceEvent<DeviceLocationPayload> {
  return createEvent(DEVICE_EVENT_TYPES.LOCATION_UPDATED, "device-agent", payload, "info");
}

export function createDeviceStatusEvent(deviceId: string, status: string): SimTraceEvent<{ deviceId: string; status: string }> {
  return createEvent(DEVICE_EVENT_TYPES.STATUS_CHANGED, "device-agent", { deviceId, status }, "warning");
}

export function createDeviceRiskAlertEvent(deviceId: string, riskScore: number, reason: string): SimTraceEvent<{ deviceId: string; riskScore: number; reason: string }> {
  return createEvent(
    DEVICE_EVENT_TYPES.RISK_ALERT,
    "intelligence-engine",
    { deviceId, riskScore, reason },
    riskScore > 75 ? "critical" : "warning"
  );
}

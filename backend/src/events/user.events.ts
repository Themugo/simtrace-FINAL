import { createEvent, SimTraceEvent } from "./types.js";

export const USER_EVENT_TYPES = {
  LOGIN_SUCCESS: "USER_LOGIN_SUCCESS",
  LOGIN_FAILED: "USER_LOGIN_FAILED",
  PRESENCE_CHANGED: "USER_PRESENCE_CHANGED",
  PROFILE_UPDATED: "USER_PROFILE_UPDATED",
};

export function createUserPresenceEvent(userId: string, status: "online" | "offline" | "away"): SimTraceEvent<{ userId: string; status: string }> {
  return createEvent(USER_EVENT_TYPES.PRESENCE_CHANGED, "auth-gateway", { userId, status }, "info");
}

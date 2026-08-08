import { createEvent, SimTraceEvent } from "./types.js";

export const CASE_EVENT_TYPES = {
  CREATED: "CASE_CREATED",
  UPDATED: "CASE_UPDATED",
  STATUS_CHANGED: "CASE_STATUS_CHANGED",
  ASSIGNED: "CASE_ASSIGNED",
  CLOSED: "CASE_CLOSED",
};

export function createCaseUpdatedEvent(caseId: string, title: string, updatedBy: string): SimTraceEvent<{ caseId: string; title: string; updatedBy: string }> {
  return createEvent(CASE_EVENT_TYPES.UPDATED, "investigation-portal", { caseId, title, updatedBy }, "info");
}

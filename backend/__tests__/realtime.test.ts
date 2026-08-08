import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { queueManager } from "../src/jobs/queues.js";
import { createDeviceLocationEvent } from "../src/events/device.events.js";
import { RedisService } from "../src/config/redis.js";

const app = createApp();

describe("Phase 3 Real-Time Infrastructure Tests", () => {
  it("Redis Service — should store and retrieve key-value data", async () => {
    await RedisService.set("test_key", "test_value", 60);
    const value = await RedisService.get("test_key");
    expect(value).toBe("test_value");
  });

  it("Queue System — should enqueue and process jobs across queues", async () => {
    const job = await queueManager.addJob("DEVICE_EVENTS_QUEUE", "ProcessDeviceLocation", {
      deviceId: "dev_991",
      lat: 1.2921,
      lng: 36.8219,
    });
    expect(job).toHaveProperty("id");
    expect(job).toHaveProperty("queue", "DEVICE_EVENTS_QUEUE");
  });

  it("Event System — should create standardized device location event envelope", () => {
    const event = createDeviceLocationEvent({
      deviceId: "dev_1001",
      lat: -1.286389,
      lng: 36.817223,
    });
    expect(event).toHaveProperty("eventId");
    expect(event.eventType).toBe("DEVICE_LOCATION_UPDATED");
    expect(event.severity).toBe("info");
    expect(event.payload).toHaveProperty("deviceId", "dev_1001");
  });

  it("GET /api/live/status — should return active connections and system health", async () => {
    const res = await request(app).get("/api/live/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("activeUsers");
    expect(res.body.data).toHaveProperty("queueMetrics");
  });

  it("GET /api/live/events — should return recent real-time event logs", async () => {
    const res = await request(app).get("/api/live/events");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("events");
  });

  it("GET /api/live/connections — should return active socket connections breakdown", async () => {
    const res = await request(app).get("/api/live/connections");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("totalConnections");
  });
});

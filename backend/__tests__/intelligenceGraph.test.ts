import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Phase 4 Intelligence Graph Engine Tests", () => {
  let createdEntityId: string;
  let targetEntityId: string;

  it("POST /api/intelligence/entity — should create a graph entity (Device)", async () => {
    const res = await request(app)
      .post("/api/intelligence/entity")
      .send({
        entityType: "DEVICE",
        externalId: "IMEI358992019921101",
        name: "Samsung Galaxy S24 Ultra",
        metadata: { brand: "Samsung", model: "S24 Ultra" },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.entity).toHaveProperty("_id");
    expect(res.body.data.entity).toHaveProperty("externalId", "IMEI358992019921101");
    createdEntityId = res.body.data.entity._id;
  });

  it("POST /api/intelligence/entity — should create a second target graph entity (SIM Card)", async () => {
    const res = await request(app)
      .post("/api/intelligence/entity")
      .send({
        entityType: "SIM_CARD",
        externalId: "IMSI89254010099120",
        name: "Safaricom SIM +254700000111",
        metadata: { carrier: "Safaricom" },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.entity).toHaveProperty("_id");
    targetEntityId = res.body.data.entity._id;
  });

  it("POST /api/intelligence/relationship — should link Device and SIM Card", async () => {
    const res = await request(app)
      .post("/api/intelligence/relationship")
      .send({
        sourceEntityId: createdEntityId,
        targetEntityId: targetEntityId,
        relationshipType: "DEVICE_USED_SIM",
        confidenceScore: 0.98,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.relationship).toHaveProperty("relationshipType", "DEVICE_USED_SIM");
  });

  it("GET /api/intelligence/search — should find entities matching search query", async () => {
    const res = await request(app).get("/api/intelligence/search?query=IMEI35899201");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });

  it("GET /api/intelligence/graph/:entityId — should build nodes and edges payload for visualization", async () => {
    const res = await request(app).get(`/api/intelligence/graph/${createdEntityId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("nodes");
    expect(res.body.data).toHaveProperty("edges");
    expect(res.body.data.nodes.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.edges.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/intelligence/risk/:entityId — should calculate risk assessment score and factors", async () => {
    const res = await request(app).get(`/api/intelligence/risk/${createdEntityId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("score");
    expect(res.body.data).toHaveProperty("level");
    expect(res.body.data).toHaveProperty("factors");
  });

  it("GET /api/intelligence/entity/:id/timeline — should return event timeline", async () => {
    const res = await request(app).get(`/api/intelligence/entity/${createdEntityId}/timeline`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("events");
  });
});

import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Phase 5 AI Risk Engine & Fraud Detection Tests", () => {
  let createdEntityId: string;
  let createdAlertId: string;

  it("Setup — create test entity in graph", async () => {
    const res = await request(app)
      .post("/api/intelligence/entity")
      .send({
        entityType: "DEVICE",
        externalId: "IMEI99001122334455",
        name: "Flagged Test iPhone 15 Pro",
        metadata: { brand: "Apple", model: "15 Pro" },
      });

    expect(res.status).toBe(201);
    createdEntityId = res.body.data.entity._id;
  });

  it("GET /api/ai/risk/:entityId — should evaluate risk score, level, and factors", async () => {
    const res = await request(app).get(`/api/ai/risk/${createdEntityId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("riskScore");
    expect(res.body.data).toHaveProperty("riskLevel");
    expect(res.body.data).toHaveProperty("factors");
    expect(res.body.data).toHaveProperty("anomalies");
  });

  it("GET /api/ai/alerts — should return active intelligence alerts", async () => {
    const res = await request(app).get("/api/ai/alerts");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("alerts");

    if (res.body.data.alerts.length > 0) {
      createdAlertId = res.body.data.alerts[0]._id;
    }
  });

  it("GET /api/ai/recommendations — should return investigation recommendations", async () => {
    const res = await request(app).get("/api/ai/recommendations");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("recommendations");
  });

  it("POST /api/ai/alerts/:id/review — should record human review decision", async () => {
    if (!createdAlertId) return;

    const res = await request(app)
      .post(`/api/ai/alerts/${createdAlertId}/review`)
      .send({
        decision: "CONFIRM",
        notes: "Investigator verified suspicious SIM swapping history.",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.review).toHaveProperty("decision", "CONFIRM");
    expect(res.body.data.alert).toHaveProperty("status", "CONFIRMED");
  });
});

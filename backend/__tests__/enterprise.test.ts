import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("Enterprise Backend Foundation Tests", () => {
  it("GET /api/health — should return 200 with standardized health status payload", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("data");
    expect(res.body.data).toHaveProperty("status");
    expect(res.body.data).toHaveProperty("uptime");
    expect(res.body.data).toHaveProperty("version", "1.0.0");
    expect(res.body.data).toHaveProperty("timestamp");
  });

  it("POST /api/auth/login — should handle authentication with standardized error/success payloads", async () => {
    // Valid request structure test
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@simtrace.org", password: "DemoPassword123!" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("token");
    expect(res.body.data.user).toHaveProperty("email", "admin@simtrace.org");
  });

  it("POST /api/auth/login — should handle invalid credentials with standardized error payload", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@simtrace.org", password: "wrongpassword" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("errorCode", "AUTHENTICATION_ERROR");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("requestId");
  });

  it("GET /api/nonexistent — should trigger standardized 404 error envelope", async () => {
    const res = await request(app).get("/api/nonexistent-route-123");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("errorCode", "RESOURCE_NOT_FOUND");
    expect(res.body).toHaveProperty("message");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("requestId");
  });
});

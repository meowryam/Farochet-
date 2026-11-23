import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
  it("returns a successful health response", async () => {
    const app = createApp();

    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "raazia-management-api" });
  });

  it("allows the configured local frontend origin", async () => {
    const previousOrigin = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "http://localhost:5174";

    try {
      const response = await request(createApp())
        .get("/api/health")
        .set("Origin", "http://localhost:5174");

      expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:5174");
    } finally {
      if (previousOrigin === undefined) {
        delete process.env.FRONTEND_URL;
      } else {
        process.env.FRONTEND_URL = previousOrigin;
      }
    }
  });

  it("does not allow the retired local frontend origin", async () => {
    const response = await request(createApp())
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("API routing", () => {
  it("returns a not-found response for unknown routes", async () => {
    const app = createApp();

    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});

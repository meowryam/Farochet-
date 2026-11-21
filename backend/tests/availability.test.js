import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

function raaziaSession(req, _res, next) {
  req.authenticatedUser = { id: "raazia-test-user", role: "RAAZIA" };
  next();
}

function customerSession(req, _res, next) {
  req.authenticatedUser = { id: "customer-test-user", role: "CUSTOMER" };
  next();
}

function createMemoryRepository() {
  let availability = null;

  return {
    async getAvailability() {
      return availability;
    },
    async upsertAvailability(information) {
      availability = availability
        ? { ...availability, information, updatedAt: new Date() }
        : { id: "current", information, updatedAt: new Date() };
      return availability;
    },
  };
}

describe("Raazia Availability Management API", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({
      dataRepository,
      authenticate: raaziaSession,
      authenticateCustomer: customerSession,
    });
  });

  it("shows no availability until Raazia saves one", async () => {
    await request(app)
      .get("/api/availability")
      .expect(200)
      .expect(({ body }) => expect(body.availability).toBeNull());

    await request(app)
      .get("/api/customer/availability")
      .expect(200)
      .expect(({ body }) => expect(body.availability).toBeNull());
  });

  it("creates and replaces the latest availability value", async () => {
    await request(app)
      .put("/api/admin/availability")
      .send({ information: "Accepting custom orders during regular weekday hours." })
      .expect(200)
      .expect(({ body }) => expect(body.availability.information).toBe(
        "Accepting custom orders during regular weekday hours.",
      ));

    await request(app)
      .put("/api/admin/availability")
      .send({ information: "Taking a short break; new inquiries are retained." })
      .expect(200);

    await request(app)
      .get("/api/customer/availability")
      .expect(200)
      .expect(({ body }) => expect(body.availability.information).toBe(
        "Taking a short break; new inquiries are retained.",
      ));

    await request(app)
      .get("/api/availability")
      .expect(200)
      .expect(({ body }) => expect(body.availability.information).toBe(
        "Taking a short break; new inquiries are retained.",
      ));
  });

  it("rejects blank, oversized, and extra availability fields", async () => {
    await request(app).put("/api/admin/availability").send({}).expect(400);
    await request(app).put("/api/admin/availability").send({ information: " " }).expect(400);
    await request(app).put("/api/admin/availability").send({ information: "x".repeat(2001) }).expect(400);
    await request(app).put("/api/admin/availability").send({
      information: "Available",
      stockStatus: "AVAILABLE",
    }).expect(400);
  });

  it("does not allow a Customer to update availability", async () => {
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession,
      authenticateCustomer: customerSession,
    });

    await request(customerApp)
      .put("/api/admin/availability")
      .send({ information: "I am available" })
      .expect(403);
  });

  it("rejects unauthenticated admin availability requests", async () => {
    const unauthenticatedApp = createApp({ dataRepository });

    await request(unauthenticatedApp)
      .get("/api/admin/availability")
      .set("x-user-role", "RAAZIA")
      .set("x-user-id", "forged-user-id")
      .expect(401);

    await request(unauthenticatedApp)
      .put("/api/admin/availability")
      .send({ information: "I am available" })
      .expect(401);
  });
});

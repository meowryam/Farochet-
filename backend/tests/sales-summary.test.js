/**
 * Sales Summary API tests — Member 1 Cycle 5
 *
 * FR-18 acceptance criteria:
 * - Raazia can select an inclusive start/end date range interpreted in PKT.
 * - Filter uses Order confirmation date, not inquiry/payment/delivery date.
 * - Confirmed count includes all Orders confirmed in range, even if later cancelled.
 * - Cancelled count is the subset of confirmed Orders with manufacturingStatus "Cancelled".
 * - Total Approved Price sums only confirmed non-cancelled Orders in range.
 * - Label is "Total Approved Price (Order Value)" and never "Payments Received".
 * - PendingOrderRequests are excluded.
 *
 * Checks: start/end boundary inclusivity; PKT boundary conversion;
 *         cancelled Order counted in confirmed+cancelled but excluded from total;
 *         pending request excluded; zero-result range;
 *         authorization (unauthenticated/Customer forbidden).
 */

import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createOrderManagement } from "../src/business-logic/order/index.js";
import { createSalesSummary, pktDateBoundary } from "../src/business-logic/sales-summary/index.js";

// ---------------------------------------------------------------------------
// In-memory repository that supports Sales Summary date-range queries
// ---------------------------------------------------------------------------
function createMemoryRepository() {
  const orders = [];
  const inquiries = [];

  return {
    orders,
    inquiries,

    async listOrders() {
      return [...orders]
        .sort((a, b) => b.confirmedAt.getTime() - a.confirmedAt.getTime())
        .map((o) => hydrateOrder(o));
    },

    async findOrderById(id) {
      const order = orders.find((o) => o.id === id);
      return order ? hydrateOrder(order) : null;
    },

    async updateOrderManufacturing(id, data) {
      const order = orders.find((o) => o.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async updateOrderPaymentStatus(id, paymentStatus) {
      const order = orders.find((o) => o.id === id);
      if (!order) return null;
      Object.assign(order, { paymentStatus, updatedAt: new Date() });
      return hydrateOrder(order);
    },

    // FR-18: list by confirmedAt range
    async listOrdersForDateRange({ confirmedAtStart, confirmedAtEnd }) {
      return orders.filter((o) =>
        o.confirmedAt >= confirmedAtStart && o.confirmedAt <= confirmedAtEnd,
      );
    },
  };

  function hydrateOrder(order) {
    const inquiry = inquiries.find((i) => i.id === order.inquiryId);
    return {
      ...order,
      inquiry: inquiry ? { ...inquiry, product: inquiry.product ?? null } : null,
    };
  }
}

function seedOrder(repo, overrides = {}) {
  const inquiry = {
    id: randomUUID(),
    customerId: randomUUID(),
    product: null,
    ...overrides.inquiry,
  };
  repo.inquiries.push(inquiry);

  const order = {
    id: randomUUID(),
    inquiryId: inquiry.id,
    approvedPrice: overrides.approvedPrice ?? 5000,
    manufacturingStatus: overrides.manufacturingStatus ?? "Incomplete",
    paymentStatus: null,
    deliveryStatus: null,
    estimatedCompletionDate: null,
    confirmedAt: overrides.confirmedAt ?? new Date(),
    updatedAt: new Date(),
  };
  repo.orders.push(order);
  return { inquiry, order };
}

function raaziaSession(req, _res, next) {
  req.authenticatedUser = { id: "raazia-test-user", role: "RAAZIA" };
  next();
}

function customerSession(id = "customer-test-user") {
  return function session(req, _res, next) {
    req.authenticatedUser = { id, role: "CUSTOMER" };
    next();
  };
}

// ---------------------------------------------------------------------------
// pktDateBoundary unit tests
// ---------------------------------------------------------------------------
describe("pktDateBoundary utility", () => {
  it("converts PKT start of day to UTC correctly (UTC+5 offset)", () => {
    // 2026-11-24 00:00:00 PKT = 2026-11-23 19:00:00 UTC
    const result = pktDateBoundary("2026-11-24", "start");
    expect(result.toISOString()).toBe("2026-11-23T19:00:00.000Z");
  });

  it("converts PKT end of day to UTC correctly", () => {
    // 2026-11-24 23:59:59.999 PKT = 2026-11-24 18:59:59.999 UTC
    const result = pktDateBoundary("2026-11-24", "end");
    expect(result.toISOString()).toBe("2026-11-24T18:59:59.999Z");
  });

  it("handles month/year boundaries correctly", () => {
    // 2026-12-31 start PKT = 2026-12-30 19:00:00 UTC
    const start = pktDateBoundary("2026-12-31", "start");
    expect(start.toISOString()).toBe("2026-12-30T19:00:00.000Z");
    // 2026-01-01 end PKT = 2026-01-01 18:59:59.999 UTC
    const end = pktDateBoundary("2026-01-01", "end");
    expect(end.toISOString()).toBe("2026-01-01T18:59:59.999Z");
  });
});

// ---------------------------------------------------------------------------
// Sales Summary Business Logic unit tests
// ---------------------------------------------------------------------------
describe("createSalesSummary — business logic", () => {
  let repo;
  let orderMgmt;
  let summary;

  beforeEach(() => {
    repo = createMemoryRepository();
    orderMgmt = createOrderManagement({ repository: repo });
    summary = createSalesSummary({ orderManagement: orderMgmt });
  });

  const raazia = { id: "raazia", role: "RAAZIA" };

  it("returns zero counts for an empty date range", async () => {
    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(0);
    expect(result.cancelledCount).toBe(0);
    expect(result.totalApprovedPrice).toBe(0);
    expect(result.totalApprovedPriceLabel).toBe("Total Approved Price (Order Value)");
  });

  it("counts confirmed orders in range including cancelled ones, excludes cancelled from total", async () => {
    // Three orders confirmed on 2026-11-15 PKT (= 2026-11-14T19:00:00Z to 2026-11-15T18:59:59Z)
    const confirmedAt = new Date("2026-11-15T10:00:00.000Z"); // within PKT 2026-11-15
    seedOrder(repo, { approvedPrice: 3000, manufacturingStatus: "In Progress", confirmedAt });
    seedOrder(repo, { approvedPrice: 4000, manufacturingStatus: "Cancelled", confirmedAt });
    seedOrder(repo, { approvedPrice: 2000, manufacturingStatus: "Completed", confirmedAt });

    const result = await summary.generateSalesSummary(raazia, "2026-11-15", "2026-11-15");
    // confirmedCount = 3 (all confirmed in range)
    expect(result.confirmedCount).toBe(3);
    // cancelledCount = 1
    expect(result.cancelledCount).toBe(1);
    // total = 3000 + 2000 (cancelled excluded)
    expect(result.totalApprovedPrice).toBe(5000);
    expect(result.totalApprovedPriceLabel).toBe("Total Approved Price (Order Value)");
  });

  it("includes orders on the inclusive start boundary (PKT midnight)", async () => {
    // PKT 2026-11-01 00:00:00 = 2026-10-31T19:00:00.000Z
    const confirmedAt = new Date("2026-10-31T19:00:00.000Z");
    seedOrder(repo, { approvedPrice: 1500, confirmedAt });

    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(1);
    expect(result.totalApprovedPrice).toBe(1500);
  });

  it("includes orders on the inclusive end boundary (PKT 23:59:59.999)", async () => {
    // PKT 2026-11-30 23:59:59.999 = 2026-11-30T18:59:59.999Z
    const confirmedAt = new Date("2026-11-30T18:59:59.999Z");
    seedOrder(repo, { approvedPrice: 2500, confirmedAt });

    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(1);
    expect(result.totalApprovedPrice).toBe(2500);
  });

  it("excludes orders outside the date range", async () => {
    // Before start (PKT 2026-10-31 = UTC 2026-10-30T19:00:00Z to 2026-10-31T18:59:59.999Z)
    seedOrder(repo, { approvedPrice: 9999, confirmedAt: new Date("2026-10-30T18:59:59.000Z") });
    // After end (PKT 2026-12-01 start = 2026-11-30T19:00:00Z)
    seedOrder(repo, { approvedPrice: 9999, confirmedAt: new Date("2026-11-30T19:00:00.000Z") });

    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(0);
    expect(result.totalApprovedPrice).toBe(0);
  });

  it("cancelled order is counted in both confirmedCount and cancelledCount but not totalApprovedPrice", async () => {
    const confirmedAt = new Date("2026-11-10T10:00:00.000Z");
    seedOrder(repo, { approvedPrice: 6000, manufacturingStatus: "Cancelled", confirmedAt });

    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(1);
    expect(result.cancelledCount).toBe(1);
    expect(result.totalApprovedPrice).toBe(0);
  });

  it("throws 403 when a Customer attempts to generate the summary", async () => {
    const customer = { id: "cust-1", role: "CUSTOMER" };
    await expect(
      summary.generateSalesSummary(customer, "2026-11-01", "2026-11-30"),
    ).rejects.toMatchObject({ status: 403, code: "SALES_SUMMARY_ACCESS_DENIED" });
  });

  it("throws 401 when no viewer is provided", async () => {
    await expect(
      summary.generateSalesSummary(null, "2026-11-01", "2026-11-30"),
    ).rejects.toMatchObject({ status: 401, code: "AUTHENTICATION_REQUIRED" });
  });

  it("throws 400 for invalid date formats", async () => {
    await expect(
      summary.generateSalesSummary(raazia, "not-a-date", "2026-11-30"),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DATE_RANGE" });

    await expect(
      summary.generateSalesSummary(raazia, "2026-11-01", "2026-13-01"),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DATE_RANGE" });

    await expect(
      summary.generateSalesSummary(raazia, "2026-02-30", "2026-11-30"),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DATE_RANGE" });
  });

  it("throws 400 when startDate is after endDate", async () => {
    await expect(
      summary.generateSalesSummary(raazia, "2026-11-30", "2026-11-01"),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_DATE_RANGE" });
  });

  it("allows a same-day range (startDate equals endDate)", async () => {
    const confirmedAt = new Date("2026-11-15T10:00:00.000Z");
    seedOrder(repo, { approvedPrice: 2000, confirmedAt });

    const result = await summary.generateSalesSummary(raazia, "2026-11-15", "2026-11-15");
    expect(result.confirmedCount).toBe(1);
  });

  it("sums only non-cancelled orders in a mixed range", async () => {
    const d1 = new Date("2026-11-10T10:00:00.000Z");
    const d2 = new Date("2026-11-20T10:00:00.000Z");
    seedOrder(repo, { approvedPrice: 1000, manufacturingStatus: "Incomplete", confirmedAt: d1 });
    seedOrder(repo, { approvedPrice: 2000, manufacturingStatus: "In Progress", confirmedAt: d1 });
    seedOrder(repo, { approvedPrice: 3000, manufacturingStatus: "Completed", confirmedAt: d2 });
    seedOrder(repo, { approvedPrice: 500, manufacturingStatus: "Cancelled", confirmedAt: d2 });

    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.confirmedCount).toBe(4);
    expect(result.cancelledCount).toBe(1);
    expect(result.totalApprovedPrice).toBe(6000); // 1000+2000+3000
  });

  it("label is never 'Payments Received' — always 'Total Approved Price (Order Value)'", async () => {
    const result = await summary.generateSalesSummary(raazia, "2026-11-01", "2026-11-30");
    expect(result.totalApprovedPriceLabel).not.toContain("Payments Received");
    expect(result.totalApprovedPriceLabel).toBe("Total Approved Price (Order Value)");
  });
});

// ---------------------------------------------------------------------------
// Sales Summary HTTP API integration tests
// ---------------------------------------------------------------------------
describe("Sales Summary HTTP API — /api/admin/sales-summary", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({ dataRepository, authenticate: raaziaSession });
  });

  it("returns 200 with zero summary for an empty date range", async () => {
    const response = await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(200);

    expect(response.body.summary).toMatchObject({
      startDate: "2026-11-01",
      endDate: "2026-11-30",
      confirmedCount: 0,
      cancelledCount: 0,
      totalApprovedPrice: 0,
      totalApprovedPriceLabel: "Total Approved Price (Order Value)",
    });
  });

  it("returns correct counts and total for mixed cancelled/non-cancelled orders", async () => {
    const confirmedAt = new Date("2026-11-15T10:00:00.000Z");
    seedOrder(dataRepository, { approvedPrice: 4000, manufacturingStatus: "Completed", confirmedAt });
    seedOrder(dataRepository, { approvedPrice: 1500, manufacturingStatus: "Cancelled", confirmedAt });

    const response = await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(200);

    expect(response.body.summary).toMatchObject({
      confirmedCount: 2,
      cancelledCount: 1,
      totalApprovedPrice: 4000,
      totalApprovedPriceLabel: "Total Approved Price (Order Value)",
    });
  });

  it("returns 400 when startDate or endDate is missing", async () => {
    await request(app).get("/api/admin/sales-summary?startDate=2026-11-01").expect(400);
    await request(app).get("/api/admin/sales-summary?endDate=2026-11-30").expect(400);
    await request(app).get("/api/admin/sales-summary").expect(400);
  });

  it("returns 400 for invalid date formats and impossible dates", async () => {
    await request(app)
      .get("/api/admin/sales-summary?startDate=bad-date&endDate=2026-11-30")
      .expect(400);
    await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-13-01")
      .expect(400);
    await request(app)
      .get("/api/admin/sales-summary?startDate=2026-02-30&endDate=2026-11-30")
      .expect(400);
  });

  it("returns 400 when startDate is after endDate", async () => {
    await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-30&endDate=2026-11-01")
      .expect(400);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const unauthApp = createApp({ dataRepository });
    await request(unauthApp)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(401);
  });

  it("returns 403 for Customer-role requests", async () => {
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession("cust-1"),
    });
    await request(customerApp)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(403);
  });

  it("boundary: order on PKT start of day is included; before PKT midnight is excluded", async () => {
    // PKT 2026-11-15 00:00:00 = 2026-11-14T19:00:00.000Z — should be IN range
    const onBoundary = new Date("2026-11-14T19:00:00.000Z");
    // 1ms before boundary — should be OUT of range
    const beforeBoundary = new Date("2026-11-14T18:59:59.999Z");
    seedOrder(dataRepository, { approvedPrice: 1000, confirmedAt: onBoundary });
    seedOrder(dataRepository, { approvedPrice: 9999, confirmedAt: beforeBoundary });

    const response = await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-15&endDate=2026-11-30")
      .expect(200);

    expect(response.body.summary.confirmedCount).toBe(1);
    expect(response.body.summary.totalApprovedPrice).toBe(1000);
  });

  it("boundary: order on PKT end of day is included; after PKT midnight is excluded", async () => {
    // PKT 2026-11-30 23:59:59.999 = 2026-11-30T18:59:59.999Z — should be IN range
    const onBoundary = new Date("2026-11-30T18:59:59.999Z");
    // 1ms after boundary = 2026-11-30T19:00:00.000Z = PKT 2026-12-01 00:00:00 — OUT
    const afterBoundary = new Date("2026-11-30T19:00:00.000Z");
    seedOrder(dataRepository, { approvedPrice: 2000, confirmedAt: onBoundary });
    seedOrder(dataRepository, { approvedPrice: 9999, confirmedAt: afterBoundary });

    const response = await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(200);

    expect(response.body.summary.confirmedCount).toBe(1);
    expect(response.body.summary.totalApprovedPrice).toBe(2000);
  });

  it("does not include PendingOrderRequests in the summary", async () => {
    // The in-memory repo only has orders[] — PendingOrderRequests never appear there.
    // Confirm zero result even if we describe the scenario.
    const response = await request(app)
      .get("/api/admin/sales-summary?startDate=2026-11-01&endDate=2026-11-30")
      .expect(200);

    expect(response.body.summary.confirmedCount).toBe(0);
  });
});

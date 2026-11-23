import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createOrderManagement } from "../src/business-logic/order/index.js";

function createMemoryRepository() {
  const inquiries = [];
  const orders = [];

  return {
    inquiries,
    orders,

    async listOrders() {
      return [...orders].sort((left, right) =>
        right.confirmedAt.getTime() - left.confirmedAt.getTime()
      ).map(hydrateOrder);
    },

    async findOrderById(id) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      return hydrateOrder(order);
    },

    async updateOrderManufacturing(id, data) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async updateOrderPaymentStatus(id, paymentStatus) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, { paymentStatus, updatedAt: new Date() });
      return hydrateOrder(order);
    },
  };

  function hydrateOrder(order) {
    const inquiry = inquiries.find((item) => item.id === order.inquiryId);
    return {
      ...order,
      inquiry: inquiry
        ? { ...inquiry, product: inquiry.product ?? null }
        : null,
    };
  }
}

function seedOrder(dataRepository, overrides = {}) {
  const inquiry = {
    id: randomUUID(),
    customerId: randomUUID(),
    product: { id: randomUUID(), name: "Custom crochet bag" },
    ...overrides.inquiry,
  };
  dataRepository.inquiries.push(inquiry);

  const order = {
    id: randomUUID(),
    inquiryId: inquiry.id,
    approvedPrice: 5000,
    negotiatedPriceSnapshot: null,
    manufacturingStatus: "Incomplete",
    paymentStatus: null,
    deliveryStatus: null,
    estimatedCompletionDate: null,
    confirmedAt: new Date(),
    updatedAt: new Date(),
  };
  Object.assign(order, overrides.order ?? {});
  dataRepository.orders.push(order);
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

describe("Confirmed Order Management API", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({ dataRepository, authenticate: raaziaSession });
  });

  it("returns an empty confirmed-order list", async () => {
    await request(app)
      .get("/api/admin/orders")
      .expect(200)
      .expect(({ body }) => expect(body.orders).toEqual([]));
  });

  it("returns representative confirmed orders with independent status defaults", async () => {
    const { inquiry, order } = seedOrder(dataRepository);

    const list = await request(app).get("/api/admin/orders").expect(200);
    expect(list.body.orders).toHaveLength(1);
    expect(list.body.orders[0]).toMatchObject({
      id: order.id,
      originalInquiryId: inquiry.id,
      customerId: inquiry.customerId,
      approvedPrice: 5000,
      manufacturingStatus: "Incomplete",
      paymentStatus: null,
      deliveryStatus: null,
    });
    expect(list.body.orders[0]).not.toHaveProperty("sourceRequestId");

    await request(app)
      .get(`/api/admin/orders/${order.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.paymentStatus).toBeNull();
        expect(body.order.deliveryStatus).toBeNull();
        expect(body.order.estimatedCompletionDate).toBeNull();
      });
  });

  it("rejects malformed and missing order identifiers", async () => {
    await request(app).get("/api/admin/orders/not-a-uuid").expect(400);
    await request(app).get(`/api/admin/orders/${randomUUID()}`).expect(404);
  });

  it("rejects unauthenticated and Customer requests to the admin order route", async () => {
    const unauthenticatedApp = createApp({ dataRepository });
    await unauthenticatedApp;
    await request(unauthenticatedApp)
      .get("/api/admin/orders")
      .set("x-user-role", "RAAZIA")
      .set("x-user-id", "forged-user-id")
      .expect(401);

    const customerApp = createApp({ dataRepository, authenticate: customerSession() });
    await request(customerApp).get("/api/admin/orders").expect(403);
  });

  it("lets a Customer list and inspect only their own orders", async () => {
    const customerId = randomUUID();
    const owned = seedOrder(dataRepository, { inquiry: { customerId } });
    const foreign = seedOrder(dataRepository);
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });

    const list = await request(customerApp).get("/api/customer/orders").expect(200);
    expect(list.body.orders).toHaveLength(1);
    expect(list.body.orders[0].id).toBe(owned.order.id);

    await request(customerApp)
      .get(`/api/customer/orders/${owned.order.id}`)
      .expect(200);
    await request(customerApp)
      .get(`/api/customer/orders/${foreign.order.id}`)
      .expect(403);
  });

  it("supports the customer URL contract with independently injected authentication", async () => {
    const customerId = randomUUID();
    const owned = seedOrder(dataRepository, { inquiry: { customerId } });
    const appWithCustomerAuth = createApp({
      dataRepository,
      authenticate: raaziaSession,
      authenticateCustomer: customerSession(customerId),
    });

    await request(appWithCustomerAuth)
      .get("/api/orders/my")
      .expect(200)
      .expect(({ body }) => {
        expect(body.orders).toHaveLength(1);
        expect(body.orders[0].id).toBe(owned.order.id);
      });

    await request(appWithCustomerAuth)
      .get(`/api/orders/${owned.order.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.order.id).toBe(owned.order.id));
  });
});

describe("Confirmed Order ownership and status independence", () => {
  it("denies cross-customer access and preserves independent status values", async () => {
    const dataRepository = createMemoryRepository();
    const customerA = randomUUID();
    const customerB = randomUUID();
    const ownedByA = seedOrder(dataRepository, { inquiry: { customerId: customerA } });
    const ownedByB = seedOrder(dataRepository, {
      inquiry: { customerId: customerB },
      order: {
        manufacturingStatus: "Completed",
        paymentStatus: "Partial Payment",
        deliveryStatus: null,
      },
    });
    const orderManagement = createOrderManagement({ repository: dataRepository });

    await expect(
      orderManagement.getOrderForViewer({ id: customerA, role: "CUSTOMER" }, ownedByB.order.id),
    ).rejects.toMatchObject({ status: 403, code: "ORDER_ACCESS_DENIED" });

    await expect(
      orderManagement.getOrderForViewer({ id: customerA, role: "CUSTOMER" }, ownedByA.order.id),
    ).resolves.toMatchObject({
      manufacturingStatus: "Incomplete",
      paymentStatus: null,
      deliveryStatus: null,
    });

    await expect(
      orderManagement.getOrderForViewer({ id: "raazia-test-user", role: "RAAZIA" }, ownedByB.order.id),
    ).resolves.toMatchObject({
      manufacturingStatus: "Completed",
      paymentStatus: "Partial Payment",
      deliveryStatus: null,
    });
  });

  it("lets Raazia update manufacturing status and the optional estimate without changing payment or delivery", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        paymentStatus: "Partial Payment",
        deliveryStatus: null,
      },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({
        manufacturingStatus: "Completed",
        estimatedCompletionDate: "2026-12-15",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.manufacturingStatus).toBe("Completed");
        expect(body.order.estimatedCompletionDate).toBe("2026-12-15T00:00:00.000Z");
        expect(body.order.paymentStatus).toBe("Partial Payment");
        expect(body.order.deliveryStatus).toBeNull();
      });

    await request(app)
      .get(`/api/admin/orders/${order.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.manufacturingStatus).toBe("Completed");
        expect(body.order.paymentStatus).toBe("Partial Payment");
        expect(body.order.deliveryStatus).toBeNull();
      });
  });

  it("lets Raazia record each approved payment state without changing the other Order statuses", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        manufacturingStatus: "In Progress",
        deliveryStatus: "Delivered",
      },
    });

    for (const paymentStatus of [
      "Advance Payment Received",
      "Partial Payment",
      "Full Payment",
      "Refunded",
    ]) {
      await request(app)
        .patch(`/api/admin/orders/${order.id}/payment-status`)
        .send({ paymentStatus })
        .expect(200)
        .expect(({ body }) => {
          expect(body.order).toMatchObject({
            manufacturingStatus: "In Progress",
            paymentStatus,
            deliveryStatus: "Delivered",
          });
        });
    }

    expect(order.manufacturingStatus).toBe("In Progress");
    expect(order.deliveryStatus).toBe("Delivered");
  });

  it("rejects unsupported or extra payment fields and non-Raazia updates", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository);
    const app = createApp({ dataRepository, authenticate: raaziaSession });

    for (const paymentStatus of ["UNPAID", "PAID"]) {
      await request(app)
        .patch(`/api/admin/orders/${order.id}/payment-status`)
        .send({ paymentStatus })
        .expect(400);
    }
    await request(app)
      .patch(`/api/admin/orders/${order.id}/payment-status`)
      .send({ paymentStatus: "Partial Payment", amount: 1000 })
      .expect(400);
    await request(app)
      .patch(`/api/admin/orders/${randomUUID()}/payment-status`)
      .send({ paymentStatus: "Partial Payment" })
      .expect(404);

    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(randomUUID()),
    });
    await request(customerApp)
      .patch(`/api/admin/orders/${order.id}/payment-status`)
      .send({ paymentStatus: "Partial Payment" })
      .expect(403);

    const unauthenticatedApp = createApp({ dataRepository });
    await request(unauthenticatedApp)
      .patch(`/api/admin/orders/${order.id}/payment-status`)
      .send({ paymentStatus: "Partial Payment" })
      .expect(401);
  });

  it("rejects invalid, empty, malformed-date, and missing manufacturing progress updates", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ manufacturingStatus: "Finished" })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({})
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ estimatedCompletionDate: "2026-02-30" })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${randomUUID()}/status`)
      .send({ manufacturingStatus: "In Progress" })
      .expect(404);
  });

  it("allows Raazia to clear the estimate and lists Not yet provided only in the customer view contract", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const customerId = randomUUID();
    const { order } = seedOrder(dataRepository, {
      inquiry: { customerId },
      order: { estimatedCompletionDate: new Date("2026-12-15T00:00:00.000Z") },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ estimatedCompletionDate: null })
      .expect(200)
      .expect(({ body }) => expect(body.order.estimatedCompletionDate).toBeNull());

    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });
    await request(customerApp)
      .get(`/api/customer/orders/${order.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.order.estimatedCompletionDate).toBeNull());
  });

  it("rejects unauthenticated and Customer attempts to update manufacturing progress", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository);
    const unauthenticatedApp = createApp({ dataRepository });
    await request(unauthenticatedApp)
    .patch(`/api/admin/orders/${order.id}/status`)
    .send({ manufacturingStatus: "Completed" })
    .expect(401);

    const customerApp = createApp({
    dataRepository,
    authenticate: customerSession(randomUUID()),
    });
    await request(customerApp)
    .patch(`/api/admin/orders/${order.id}/status`)
    .send({ manufacturingStatus: "Completed" })
    .expect(403);
  });
});

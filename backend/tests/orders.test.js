import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createOrderManagement } from "../src/business-logic/order/index.js";

function createMemoryRepository() {
  const inquiries = [];
  const orders = [];
  const priceRevisions = [];

  const repository = {
    inquiries,
    orders,
    priceRevisions,

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

    async updateOrderDelivery(id, data, priceRevision = null) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      if (priceRevision) {
        this.priceRevisions.push({
          id: randomUUID(),
          orderId: id,
          ...priceRevision,
          createdAt: new Date(),
        });
      }
      return hydrateOrder(order);
    },

    async updateOrderApprovedPrice(id, data, priceRevision) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      this.priceRevisions.push({
        id: randomUUID(),
        orderId: id,
        ...priceRevision,
        createdAt: new Date(),
      });
      return hydrateOrder(order);
    },

    async recordOrderSpecificationChange(id, data) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async updateOrderCancellationRequest(id, data) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async recordCancellationDecision(id, data) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, data, { updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async updateOrderRefundOutcome(id, data) {
      const order = orders.find((item) => item.id === id);
      if (!order) return null;
      Object.assign(order, { refundOutcome: data.refundOutcome, updatedAt: new Date() });
      return hydrateOrder(order);
    },

    async withOrderTransaction(callback) {
      const orderSnapshot = orders.map((order) => ({
        reference: order,
        data: { ...order },
      }));
      const revisionSnapshot = priceRevisions.map((revision) => ({
        reference: revision,
        data: { ...revision },
      }));
      try {
        return await callback(repository);
      } catch (error) {
        orders.length = 0;
        for (const snapshot of orderSnapshot) {
          for (const key of Object.keys(snapshot.reference)) {
            if (!Object.prototype.hasOwnProperty.call(snapshot.data, key)) {
              delete snapshot.reference[key];
            }
          }
          Object.assign(snapshot.reference, snapshot.data);
          orders.push(snapshot.reference);
        }
        priceRevisions.length = 0;
        for (const snapshot of revisionSnapshot) {
          for (const key of Object.keys(snapshot.reference)) {
            if (!Object.prototype.hasOwnProperty.call(snapshot.data, key)) {
              delete snapshot.reference[key];
            }
          }
          Object.assign(snapshot.reference, snapshot.data);
          priceRevisions.push(snapshot.reference);
        }
        throw error;
      }
    },
  };

  function hydrateOrder(order) {
    const inquiry = inquiries.find((item) => item.id === order.inquiryId);
    return {
      ...order,
      inquiry: inquiry
        ? { ...inquiry, product: inquiry.product ?? null }
        : null,
      priceRevisions: priceRevisions.filter((revision) => revision.orderId === order.id),
    };
  }

  return repository;
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
    deliveryMethod: null,
    deliveryFee: null,
    deliveryTrackingInformation: null,
    estimatedCompletionDate: null,
    specificationChangeNotes: null,
    specificationChangeRecordedAt: null,
    specificationChangeResolvedAt: null,
    cancellationRequestedAt: null,
    cancellationRequestReason: null,
    cancellationApproved: null,
    cancellationDecisionAt: null,
    cancellationDecisionNotes: null,
    refundOutcome: null,
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

  it("records local handover with zero fee and preserves all other statuses", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        manufacturingStatus: "In Progress",
        paymentStatus: "Partial Payment",
      },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Local handover",
        deliveryFee: 0,
        deliveryStatus: null,
        deliveryTrackingInformation: "Handed over in person",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order).toMatchObject({
          deliveryMethod: "Local handover",
          deliveryFee: 0,
          deliveryStatus: null,
          manufacturingStatus: "In Progress",
          paymentStatus: "Partial Payment",
        });
      });
  });

  it("requires courier fee and rejects a nonzero local handover fee", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery" })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: null })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: -1 })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: 1.5 })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Local handover" })
      .expect(200)
      .expect(({ body }) => expect(body.order.deliveryFee).toBe(0));

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Local handover", deliveryFee: 50 })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Local handover",
        deliveryFee: 0,
        courierFeeIncrease: 200,
      })
      .expect(400);
  });

  it("absorbs fee increases below 200 and records no price revision", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 500,
        courierFeeIncrease: 199,
      })
      .expect(200)
      .expect(({ body }) => expect(body.order.approvedPrice).toBe(5000));

    expect(order.approvedPrice).toBe(5000);
    expect(dataRepository.priceRevisions ?? []).toEqual([]);
  });

  it("requires agreement and atomically records significant fee price history", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 500,
        courierFeeIncrease: 200,
        customerAgreed: true,
        revisedApprovedPrice: 5200,
        actingUserId: "client-supplied-user",
      })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 500,
        courierFeeIncrease: 200,
      })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 500,
        courierFeeIncrease: 200,
        customerAgreed: true,
        revisedApprovedPrice: 5200,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.approvedPrice).toBe(5200);
        expect(body.order.deliveryStatus).toBeNull();
      });

    expect(order.approvedPrice).toBe(5200);
    expect(dataRepository.priceRevisions).toHaveLength(1);
    expect(dataRepository.priceRevisions[0]).toMatchObject({
      orderId: order.id,
      originalPrice: 5000,
      revisedPrice: 5200,
      actingUserId: "raazia-test-user",
      customerAgreed: true,
    });
  });

  it("rejects a significant courier increase on an already Delivered order without mutation", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: { deliveryStatus: "Delivered" },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 700,
        courierFeeIncrease: 200,
        customerAgreed: true,
        revisedApprovedPrice: 5200,
      })
      .expect(400);

    expect(order.approvedPrice).toBe(5000);
    expect(order.deliveryStatus).toBe("Delivered");
    expect(dataRepository.priceRevisions ?? []).toEqual([]);
  });

  it("rejects Delivered status together with a significant courier increase without mutation", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 700,
        courierFeeIncrease: 200,
        customerAgreed: true,
        revisedApprovedPrice: 5200,
        deliveryStatus: "Delivered",
      })
      .expect(400);

    expect(order.approvedPrice).toBe(5000);
    expect(order.deliveryStatus).toBeNull();
    expect(dataRepository.priceRevisions ?? []).toEqual([]);
  });

  it("rejects Customer delivery updates and preserves NULL until Delivered", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository);
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(randomUUID()),
    });

    await request(customerApp)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: 300 })
      .expect(403);

    const raaziaApp = createApp({ dataRepository, authenticate: raaziaSession });
    await request(raaziaApp)
      .get(`/api/admin/orders/${order.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.order.deliveryStatus).toBeNull());
  });

  it("does not revise Approved Price for a delivery update without a pre-dispatch fee increase", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 500,
        deliveryStatus: "Delivered",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.approvedPrice).toBe(5000);
        expect(body.order.deliveryStatus).toBe("Delivered");
      });

    expect(order.approvedPrice).toBe(5000);
    expect(dataRepository.priceRevisions ?? []).toEqual([]);
  });
});

describe("Order changes and cancellation", () => {
  it("records an authorized, agreed price revision with the required change information", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({
        revisedApprovedPrice: 5500,
        customerAgreed: false,
        reason: "Agreed specification change",
      })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({
        revisedApprovedPrice: 5500,
        customerAgreed: true,
        reason: "Agreed specification change",
        actingUserId: "client-supplied-user",
      })
      .expect(400);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({
        revisedApprovedPrice: 5500,
        customerAgreed: true,
        reason: "Agreed specification change",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.approvedPrice).toBe(5500);
        expect(body.order.priceRevisions).toHaveLength(1);
        expect(body.order.priceRevisions[0]).toMatchObject({
          originalPrice: 5000,
          revisedPrice: 5500,
          actingUserId: "raazia-test-user",
          customerAgreed: true,
          reason: "Agreed specification change",
        });
        expect(body.order.priceRevisions[0].createdAt).toBeTruthy();
      });

    expect(order.approvedPrice).toBe(5500);
    expect(dataRepository.priceRevisions).toHaveLength(1);
  });

  it("rejects unauthenticated, Customer, and malformed price revisions", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository);
    const app = createApp({ dataRepository, authenticate: raaziaSession });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({ revisedApprovedPrice: 0, customerAgreed: true, reason: "Correction" })
      .expect(400);
    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({ revisedApprovedPrice: 5000, customerAgreed: true, reason: "   " })
      .expect(400);

    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(randomUUID()),
    });
    await request(customerApp)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({ revisedApprovedPrice: 5000, customerAgreed: true, reason: "Correction" })
      .expect(403);

    const unauthenticatedApp = createApp({ dataRepository });
    await request(unauthenticatedApp)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({ revisedApprovedPrice: 5000, customerAgreed: true, reason: "Correction" })
      .expect(401);
  });

  it("records a cost-affecting specification change, holds the Order, and prevents outdated progress", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, { order: { paymentStatus: "Partial Payment" } });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/specification-change`)
      .send({ notes: "Larger size changes material cost." })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.manufacturingStatus).toBe("On Hold");
        expect(body.order.specificationChangeNotes).toBe("Larger size changes material cost.");
        expect(body.order.specificationChangeResolvedAt).toBeNull();
      });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ manufacturingStatus: "In Progress" })
      .expect(409);

    await request(app)
      .patch(`/api/admin/orders/${order.id}/price-revision`)
      .send({
        revisedApprovedPrice: 5600,
        customerAgreed: true,
        reason: "Agreed revised specification",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.specificationChangeResolvedAt).toBeTruthy();
        expect(body.order.approvedPrice).toBe(5600);
      });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .send({ manufacturingStatus: "In Progress" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.manufacturingStatus).toBe("In Progress");
        expect(body.order.paymentStatus).toBe("Partial Payment");
        expect(body.order.deliveryStatus).toBeNull();
      });
  });

  it("lets the owning Customer request cancellation but keeps the decision with Raazia", async () => {
    const dataRepository = createMemoryRepository();
    const customerId = randomUUID();
    const { order: owned } = seedOrder(dataRepository, { inquiry: { customerId } });
    const { order: foreign } = seedOrder(dataRepository);
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });
    const adminApp = createApp({ dataRepository, authenticate: raaziaSession });

    await request(customerApp)
      .post(`/api/customer/orders/${foreign.id}/cancellation-request`)
      .send({ reason: "Not mine" })
      .expect(403);

    await request(customerApp)
      .post(`/api/customer/orders/${owned.id}/cancellation-request`)
      .send({ reason: "Changed my mind" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.cancellationRequestedAt).toBeTruthy();
        expect(body.order.cancellationRequestReason).toBe("Changed my mind");
        expect(body.order.cancellationApproved).toBeNull();
        expect(body.order.manufacturingStatus).toBe("Incomplete");
      });

    await request(customerApp)
      .patch(`/api/admin/orders/${owned.id}/cancellation-decision`)
      .send({ approved: true })
      .expect(403);

    await request(adminApp)
      .patch(`/api/admin/orders/${owned.id}/cancellation-decision`)
      .send({
        approved: true,
        notes: "Raazia decided to cancel.",
        refundOutcome: "Full refund recorded manually.",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.manufacturingStatus).toBe("Cancelled");
        expect(body.order.cancellationApproved).toBe(true);
        expect(body.order.cancellationDecisionNotes).toBe("Raazia decided to cancel.");
        expect(body.order.refundOutcome).toBe("Full refund recorded manually.");
        expect(body.order.paymentStatus).toBeNull();
        expect(body.order.deliveryStatus).toBeNull();
      });

    await request(adminApp)
      .patch(`/api/admin/orders/${owned.id}/status`)
      .send({ manufacturingStatus: "In Progress" })
      .expect(409);
    await request(adminApp)
      .patch(`/api/admin/orders/${owned.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: 300, deliveryStatus: "Delivered" })
      .expect(409);
  });

  it("retains a rejected cancellation request and never executes a refund", async () => {
    const dataRepository = createMemoryRepository();
    const customerId = randomUUID();
    const { order } = seedOrder(dataRepository, {
      inquiry: { customerId },
      order: { paymentStatus: "Partial Payment", deliveryStatus: null },
    });
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });
    const adminApp = createApp({ dataRepository, authenticate: raaziaSession });

    await request(adminApp)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({ approved: false })
      .expect(409);

    await request(customerApp)
      .post(`/api/customer/orders/${order.id}/cancellation-request`)
      .send({})
      .expect(200);

    await request(adminApp)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({
        approved: false,
        notes: "No financial loss; continue.",
        refundOutcome: "Manually recorded outcome.",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.cancellationApproved).toBe(false);
        expect(body.order.manufacturingStatus).toBe("Incomplete");
        expect(body.order.paymentStatus).toBe("Partial Payment");
        expect(body.order.deliveryStatus).toBeNull();
        expect(body.order.refundOutcome).toBe("Manually recorded outcome.");
      });

    await request(adminApp)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({ approved: false, notes: "Repeated click." })
      .expect(200)
      .expect(({ body }) => expect(body.order.cancellationDecisionNotes).toBe("No financial loss; continue."));

    expect(order.cancellationApproved).toBe(false);
    expect(order.manufacturingStatus).toBe("Incomplete");
  });

  it("rejects delivered-order cancellation approval and price revisions on cancelled Orders", async () => {
    const dataRepository = createMemoryRepository();
    const customerId = randomUUID();
    const { order: delivered } = seedOrder(dataRepository, {
      inquiry: { customerId },
      order: { deliveryStatus: "Delivered" },
    });
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });
    const adminApp = createApp({ dataRepository, authenticate: raaziaSession });

    await request(customerApp)
      .post(`/api/customer/orders/${delivered.id}/cancellation-request`)
      .send({})
      .expect(200);
    await request(adminApp)
      .patch(`/api/admin/orders/${delivered.id}/cancellation-decision`)
      .send({ approved: true })
      .expect(409);

    const { order: cancelled } = seedOrder(dataRepository, {
      order: { manufacturingStatus: "Cancelled", cancellationApproved: true },
    });
    await request(adminApp)
      .patch(`/api/admin/orders/${cancelled.id}/price-revision`)
      .send({ revisedApprovedPrice: 5200, customerAgreed: true, reason: "Late change" })
      .expect(409);

    const { order: statusCancelled } = seedOrder(dataRepository, {
      order: { manufacturingStatus: "Cancelled" },
    });
    await request(adminApp)
      .patch(`/api/admin/orders/${statusCancelled.id}/status`)
      .send({ manufacturingStatus: "In Progress" })
      .expect(409);
    await request(adminApp)
      .patch(`/api/admin/orders/${statusCancelled.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: 300, deliveryStatus: "Delivered" })
      .expect(409);
  });

  it("lets Raazia approve cancellation without a Customer request after renegotiation fails", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        manufacturingStatus: "On Hold",
        specificationChangeNotes: "Larger size changes material cost.",
        specificationChangeRecordedAt: new Date(),
        specificationChangeResolvedAt: null,
      },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({
        approved: true,
        notes: "No mutually acceptable price; proceeding would cause financial loss.",
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.cancellationRequestedAt).toBeNull();
        expect(body.order.cancellationRequestReason).toBeNull();
        expect(body.order.cancellationApproved).toBe(true);
        expect(body.order.manufacturingStatus).toBe("Cancelled");
        expect(body.order.cancellationDecisionNotes).toBe(
          "No mutually acceptable price; proceeding would cause financial loss.",
        );
      });
  });

  it("rolls back the On Hold status when the specification record cannot be committed", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository);
    const updateManufacturing = dataRepository.updateOrderManufacturing.bind(dataRepository);
    dataRepository.updateOrderManufacturing = async (...args) => {
      const updated = await updateManufacturing(...args);
      throw new Error("simulated transaction failure");
    };
    const app = createApp({ dataRepository, authenticate: raaziaSession });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/specification-change`)
      .send({ notes: "Larger size changes material cost." })
      .expect(500);

    expect(order.manufacturingStatus).toBe("Incomplete");
    expect(order.specificationChangeNotes).toBeNull();
    expect(order.specificationChangeRecordedAt).toBeNull();
  });

  it("rolls back the Cancelled status when the cancellation decision cannot be committed", async () => {
    const dataRepository = createMemoryRepository();
    const { order } = seedOrder(dataRepository, {
      order: { cancellationRequestedAt: new Date() },
    });
    const recordDecision = dataRepository.recordCancellationDecision.bind(dataRepository);
    dataRepository.recordCancellationDecision = async (...args) => {
      const recorded = await recordDecision(...args);
      throw new Error("simulated transaction failure");
    };
    const app = createApp({ dataRepository, authenticate: raaziaSession });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({ approved: true, notes: "Approved." })
      .expect(500);

    expect(order.manufacturingStatus).toBe("Incomplete");
    expect(order.cancellationApproved).toBeNull();
    expect(order.cancellationDecisionAt).toBeNull();
  });

  it("blocks dispatch and courier-fee revisions while a specification change is unresolved", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        manufacturingStatus: "On Hold",
        specificationChangeNotes: "Larger size changes material cost.",
        specificationChangeRecordedAt: new Date(),
        specificationChangeResolvedAt: null,
      },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({ deliveryMethod: "Courier/service delivery", deliveryFee: 300, deliveryStatus: "Delivered" })
      .expect(409)
      .expect(({ body }) => expect(body.error.code).toBe("SPECIFICATION_CHANGE_DELIVERY_DENIED"));

    await request(app)
      .patch(`/api/admin/orders/${order.id}/delivery`)
      .send({
        deliveryMethod: "Courier/service delivery",
        deliveryFee: 300,
        courierFeeIncrease: 200,
        customerAgreed: true,
        revisedApprovedPrice: 5200,
      })
      .expect(409);

    expect(order.deliveryStatus).toBeNull();
    expect(order.approvedPrice).toBe(5000);
    expect(dataRepository.priceRevisions).toEqual([]);
  });

  it("rejects a cancellation decision conflict with an already Cancelled Order", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: {
        manufacturingStatus: "Cancelled",
        cancellationApproved: true,
        cancellationDecisionNotes: "Approved earlier.",
      },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/cancellation-decision`)
      .send({ approved: false, notes: "Late rejection." })
      .expect(409)
      .expect(({ body }) => expect(body.error.code).toBe("CANCELLED_ORDER_DECISION_CONFLICT"));

    expect(order.cancellationApproved).toBe(true);
    expect(order.manufacturingStatus).toBe("Cancelled");

    const { order: rejected } = seedOrder(dataRepository, {
      order: { cancellationApproved: false },
    });
    await request(app)
      .patch(`/api/admin/orders/${rejected.id}/status`)
      .send({ manufacturingStatus: "Cancelled" })
      .expect(409)
      .expect(({ body }) => expect(body.error.code).toBe("CANCELLED_ORDER_DECISION_CONFLICT"));
    expect(rejected.manufacturingStatus).toBe("Incomplete");
  });

  it("records a manual refund outcome without changing statuses or executing a refund", async () => {
    const dataRepository = createMemoryRepository();
    const app = createApp({ dataRepository, authenticate: raaziaSession });
    const { order } = seedOrder(dataRepository, {
      order: { paymentStatus: "Partial Payment" },
    });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/refund-outcome`)
      .send({ refundOutcome: "Full refund recorded manually." })
      .expect(200)
      .expect(({ body }) => {
        expect(body.order.refundOutcome).toBe("Full refund recorded manually.");
        expect(body.order.paymentStatus).toBe("Partial Payment");
        expect(body.order.manufacturingStatus).toBe("Incomplete");
        expect(body.order.cancellationApproved).toBeNull();
      });

    await request(app)
      .patch(`/api/admin/orders/${order.id}/refund-outcome`)
      .send({ refundOutcome: null })
      .expect(200)
      .expect(({ body }) => expect(body.order.refundOutcome).toBeNull());

    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(randomUUID()),
    });
    await request(customerApp)
      .patch(`/api/admin/orders/${order.id}/refund-outcome`)
      .send({ refundOutcome: "Customer attempt" })
      .expect(403);
  });

  it("excludes internal decision notes and price history from Customer order views", async () => {
    const dataRepository = createMemoryRepository();
    const customerId = randomUUID();
    const { order } = seedOrder(dataRepository, {
      inquiry: { customerId },
      order: { cancellationDecisionNotes: "Raazia internal note" },
    });
    await dataRepository.updateOrderApprovedPrice(order.id, { approvedPrice: 5200 }, {
      originalPrice: 5000,
      revisedPrice: 5200,
      actingUserId: "raazia-test-user",
      customerAgreed: true,
      reason: "Agreed revision",
    });
    const adminApp = createApp({ dataRepository, authenticate: raaziaSession });
    const customerApp = createApp({
      dataRepository,
      authenticate: customerSession(customerId),
    });

    const adminList = await request(adminApp).get("/api/admin/orders").expect(200);
    expect(adminList.body.orders[0]).toHaveProperty("cancellationDecisionNotes");
    expect(adminList.body.orders[0]).toHaveProperty("priceRevisions");

    const customerList = await request(customerApp).get("/api/customer/orders").expect(200);
    expect(customerList.body.orders[0]).not.toHaveProperty("cancellationDecisionNotes");
    expect(customerList.body.orders[0]).not.toHaveProperty("priceRevisions");

    await request(customerApp)
      .get(`/api/customer/orders/${order.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.order).not.toHaveProperty("cancellationDecisionNotes");
        expect(body.order).not.toHaveProperty("priceRevisions");
      });

    await request(customerApp)
      .post(`/api/customer/orders/${order.id}/cancellation-request`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expect(body.order).not.toHaveProperty("cancellationDecisionNotes");
        expect(body.order).not.toHaveProperty("priceRevisions");
      });
  });
});

describe("Order change architecture and migration boundaries", () => {
  const migration = readFileSync(
    new URL("../prisma/migrations/20261125120000_order_changes_cancellation/migration.sql", import.meta.url),
    "utf8",
  );
  const orderBusinessLogic = readFileSync(
    new URL("../src/business-logic/order/index.js", import.meta.url),
    "utf8",
  );

  it("grants least-privilege runtime reads and RLS for order price history", () => {
    expect(migration).toContain('GRANT SELECT ON TABLE public."OrderPriceRevision" TO farochet_runtime;');
    expect(migration).toMatch(/CREATE POLICY runtime_order_price_revision_select[\s\S]*FOR SELECT[\s\S]*TO farochet_runtime/);
  });

  it("grants runtime UPDATE for status and order-change columns", () => {
    const grantMatch = migration.match(/GRANT UPDATE \(([\s\S]*?)\) ON TABLE public\."Order" TO farochet_runtime;/);
    expect(grantMatch).not.toBeNull();
    for (const column of [
      '"manufacturingStatus"',
      '"paymentStatus"',
      '"estimatedCompletionDate"',
      '"refundOutcome"',
      '"cancellationApproved"',
      '"cancellationDecisionNotes"',
    ]) {
      expect(grantMatch[1]).toContain(column);
    }
  });

  it("does not add decentralized Raazia role checks to Order Management", () => {
    expect(orderBusinessLogic).not.toMatch(/assertRaazia|assertCustomer/);
    expect(orderBusinessLogic).toContain("Role authorization belongs to centralized Middleware");
  });
});

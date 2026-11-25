import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createInMemoryImageStorage } from "../src/data-access/storage/inMemoryImageStorage.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const RAAZIA_ID = "33333333-3333-4333-8333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-8444-444444444444";

const adminAcceptPath = (id) => `/api/admin/customization/requests/${id}/accept`;
const adminRejectPath = (id) => `/api/admin/customization/requests/${id}/reject`;
const customerAcceptPath = (id) => `/api/customer/customization/requests/${id}/accept`;
const customerRejectPath = (id) => `/api/customer/customization/requests/${id}/reject`;
const negotiationPath = (id) => `/api/admin/customization/requests/${id}/negotiation`;

function requestNotPendingError() {
  const error = new Error("Request is not pending.");
  error.status = 409;
  error.code = "REQUEST_NOT_PENDING";
  return error;
}

function createMemoryRepository() {
  const inquiries = [];
  const customizations = [];
  const pendingOrderRequests = [];
  const negotiationEntries = [];
  const products = [];
  const users = new Map();
  const orders = [];
  const publicDiscount = { id: "current", active: false, fixedDiscountAmount: null };
  let entrySequence = 0;

  function decorate(record) {
    const customization = customizations.find((item) => item.id === record.customizationId) ?? null;
    const inquiry = inquiries.find((item) => item.id === customization?.inquiryId) ?? null;
    const user = users.get(inquiry?.customerId) ?? null;

    return {
      id: record.id,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      customization: customization ? { ...customization } : null,
      inquiry: inquiry ? {
        id: inquiry.id,
        message: inquiry.message,
        createdAt: inquiry.createdAt,
        customerId: inquiry.customerId,
        productId: inquiry.productId ?? null,
        customer: user ? { id: user.id, displayName: user.displayName } : null,
      } : null,
    };
  }

  function hydrateOrder(order) {
    const inquiry = inquiries.find((item) => item.id === order.inquiryId) ?? null;
    return {
      ...order,
      inquiry: inquiry
        ? { ...inquiry, product: products.find((product) => product.id === inquiry.productId) ?? null }
        : null,
    };
  }

  return {
    inquiries,
    customizations,
    pendingOrderRequests,
    negotiationEntries,
    products,
    users,
    orders,
    publicDiscount,

    async createCustomizationRequest({ inquiry, customization }) {
      const createdInquiry = { id: randomUUID(), createdAt: new Date(), ...inquiry };
      const createdCustomization = {
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...customization,
        inquiryId: createdInquiry.id,
      };
      const pendingOrderRequest = {
        id: randomUUID(),
        customizationId: createdCustomization.id,
        status: "PENDING",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inquiries.push(createdInquiry);
      customizations.push(createdCustomization);
      pendingOrderRequests.push(pendingOrderRequest);

      return { inquiry: createdInquiry, customization: createdCustomization, pendingOrderRequest };
    },

    async findCustomizationRequestById(id) {
      const record = pendingOrderRequests.find((item) => item.id === id);
      return record ? decorate(record) : null;
    },

    async createNegotiationEntry({ customizationId, proposer, proposedPrice, note }) {
      const entry = {
        id: randomUUID(),
        customizationId,
        proposer,
        proposedPrice,
        note: note ?? null,
        createdAt: new Date(Date.now() + entrySequence++),
      };
      negotiationEntries.push(entry);
      return { ...entry };
    },

    async listNegotiationEntries(customizationId) {
      return negotiationEntries
        .filter((entry) => entry.customizationId === customizationId)
        .slice()
        .sort((left, right) => left.createdAt - right.createdAt || left.id.localeCompare(right.id))
        .map((entry) => ({ ...entry }));
    },

    async findProductById(id) {
      return products.find((product) => product.id === id) ?? null;
    },

    async getPublicDiscount() {
      return { ...publicDiscount };
    },

    // Mirrors the production conditional update + Order insert in one
    // transaction. The first await yields so two concurrent calls cannot
    // both observe PENDING.
    async decidePendingRequest({ requestId, decision, order = null }) {
      const index = pendingOrderRequests.findIndex((item) => item.id === requestId);
      if (index === -1) return null;
      await Promise.resolve();

      const record = pendingOrderRequests[index];
      if (record.status !== "PENDING") throw requestNotPendingError();

      const updated = { ...record, status: decision, updatedAt: new Date() };
      pendingOrderRequests[index] = updated;

      let createdOrder = null;
      if (order) {
        await Promise.resolve();
        createdOrder = {
          id: randomUUID(),
          inquiryId: order.inquiryId,
          approvedPrice: order.approvedPrice,
          negotiatedPriceSnapshot: order.negotiatedPriceSnapshot ?? null,
          manufacturingStatus: order.manufacturingStatus,
          paymentStatus: order.paymentStatus ?? null,
          deliveryStatus: order.deliveryStatus ?? null,
          deliveryMethod: null,
          deliveryFee: null,
          deliveryTrackingInformation: null,
          estimatedCompletionDate: null,
          confirmedAt: new Date(),
          updatedAt: new Date(),
        };
        orders.push(createdOrder);
      }

      return {
        request: { id: updated.id, status: updated.status },
        order: createdOrder ? hydrateOrder(createdOrder) : null,
      };
    },

    async listOrders() {
      return orders.map(hydrateOrder);
    },

    async findOrderById(id) {
      const order = orders.find((item) => item.id === id);
      return order ? hydrateOrder(order) : null;
    },
  };
}

async function seedRequest(dataRepository, {
  customerId = CUSTOMER_ID,
  productId = PRODUCT_ID,
  displayName = "Ayesha",
} = {}) {
  const created = await dataRepository.createCustomizationRequest({
    inquiry: { customerId, productId, message: "Custom order question." },
    customization: {
      productType: "Crochet rose bouquet",
      size: null,
      colour: null,
      materials: null,
      quantity: 1,
      budget: null,
      specialInstructions: null,
      requiredCompletionDate: null,
      deliveryAddress: null,
      referenceImages: [],
    },
  });
  dataRepository.users.set(customerId, { id: customerId, displayName });
  return created;
}

function session(userId, role) {
  return function sessionMiddleware(req, _res, next) {
    req.authenticatedUser = { id: userId, role };
    next();
  };
}

describe("Request Acceptance & Rejection / Order Handoff (FR-10, FR-11, FR-12; ADR-002, ADR-004, ADR-005)", () => {
  let dataRepository;
  let imageStorage;
  let seeded;
  let requestId;
  let adminApp;
  let ownerApp;

  beforeEach(async () => {
    dataRepository = createMemoryRepository();
    dataRepository.products.push({ id: PRODUCT_ID, name: "Crochet rose", basePrice: 5000 });
    imageStorage = createInMemoryImageStorage();
    seeded = await seedRequest(dataRepository);
    requestId = seeded.pendingOrderRequest.id;

    adminApp = createApp({
      dataRepository,
      imageStorage,
      authenticate: session(RAAZIA_ID, "RAAZIA"),
    });
    ownerApp = createApp({
      dataRepository,
      imageStorage,
      authenticateCustomer: session(CUSTOMER_ID, "CUSTOMER"),
    });
  });

  it("accepts a pending request, creates exactly one Order, and links it to the original Inquiry", async () => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(201);

    expect(response.body).toMatchObject({ requestId, status: "ACCEPTED" });
    expect(response.body.order).toMatchObject({
      originalInquiryId: seeded.inquiry.id,
      customerId: CUSTOMER_ID,
      approvedPrice: 4500,
      negotiatedPriceSnapshot: null,
    });
    expect(dataRepository.orders).toHaveLength(1);
    expect(dataRepository.orders[0].inquiryId).toBe(seeded.inquiry.id);
  });

  it("initializes manufacturing Incomplete with payment and delivery NULL", async () => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(201);

    expect(response.body.order).toMatchObject({
      manufacturingStatus: "Incomplete",
      paymentStatus: null,
      deliveryStatus: null,
      deliveryMethod: null,
      deliveryFee: null,
      deliveryTrackingInformation: null,
      estimatedCompletionDate: null,
    });
  });

  it("stores the approved price and the selected negotiation entry's proposed price as the snapshot", async () => {
    const entry = await request(adminApp)
      .post(negotiationPath(requestId))
      .send({ proposedPrice: 4200 })
      .expect(201);
    await request(ownerApp)
      .post(`/api/customer/customization/requests/${requestId}/negotiation`)
      .send({ proposedPrice: 3900 })
      .expect(201);

    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4750, negotiationEntryId: entry.body.entry.id })
      .expect(201);

    expect(response.body.order.approvedPrice).toBe(4750);
    expect(response.body.order.negotiatedPriceSnapshot).toBe(4200);
    expect(dataRepository.negotiationEntries).toHaveLength(2);
  });

  it("gives a null snapshot when an accepted request has no negotiated offer", async () => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 5000 })
      .expect(201);

    expect(response.body.order.negotiatedPriceSnapshot).toBeNull();
  });

  it("rejects a negotiation entry belonging to another Customization", async () => {
    const other = await seedRequest(dataRepository, {
      customerId: OTHER_CUSTOMER_ID,
      productId: null,
      displayName: "Sana",
    });
    const otherEntry = await request(adminApp)
      .post(negotiationPath(other.pendingOrderRequest.id))
      .send({ proposedPrice: 3100 })
      .expect(201);

    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4000, negotiationEntryId: otherEntry.body.entry.id })
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_NEGOTIATION_ENTRY");
    expect(dataRepository.orders).toHaveLength(0);
    expect(dataRepository.pendingOrderRequests[0].status).toBe("PENDING");
  });

  it.each([
    ["zero", 0],
    ["negative", -5],
    ["fractional", 10.5],
    ["string", "4500"],
  ])("rejects a %s approved price", async (_label, approvedPrice) => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(dataRepository.orders).toHaveLength(0);
  });

  it("rejects a missing approved price", async () => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ negotiationEntryId: randomUUID() })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects client-supplied identity, status, or Order fields", async () => {
    const response = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({
        approvedPrice: 4500,
        inquiryId: seeded.inquiry.id,
        customerId: CUSTOMER_ID,
        status: "ACCEPTED",
        manufacturingStatus: "Completed",
        paymentStatus: "Full Payment",
        deliveryStatus: "Delivered",
      })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(dataRepository.orders).toHaveLength(0);
    expect(dataRepository.pendingOrderRequests[0].status).toBe("PENDING");
  });

  it("retains the request, Inquiry and Customization on rejection and creates no Order", async () => {
    const response = await request(adminApp)
      .post(adminRejectPath(requestId))
      .send({})
      .expect(200);

    expect(response.body).toEqual({ requestId, status: "REJECTED" });
    expect(dataRepository.orders).toHaveLength(0);

    const detail = await request(adminApp)
      .get(`/api/admin/customization/requests/${requestId}`)
      .expect(200);
    expect(detail.body.request).toMatchObject({
      id: requestId,
      status: "REJECTED",
      inquiry: { id: seeded.inquiry.id, customerId: CUSTOMER_ID },
      customization: { id: seeded.customization.id, inquiryId: seeded.inquiry.id },
    });
  });

  it("rejects any rejection body field", async () => {
    const response = await request(adminApp)
      .post(adminRejectPath(requestId))
      .send({ reason: "too busy" })
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(dataRepository.pendingOrderRequests[0].status).toBe("PENDING");
  });

  it("returns 409 for a repeated accept and still has exactly one Order", async () => {
    await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(201);

    const repeated = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(409);

    expect(repeated.body.error.code).toBe("REQUEST_NOT_PENDING");
    expect(dataRepository.orders).toHaveLength(1);
  });

  it("returns 409 for accept after reject and reject after accept", async () => {
    const other = await seedRequest(dataRepository, {
      customerId: OTHER_CUSTOMER_ID,
      productId: null,
      displayName: "Sana",
    });

    await request(adminApp).post(adminRejectPath(requestId)).send({}).expect(200);
    const acceptAfterReject = await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(409);
    expect(acceptAfterReject.body.error.code).toBe("REQUEST_NOT_PENDING");

    await request(adminApp)
      .post(adminAcceptPath(other.pendingOrderRequest.id))
      .send({ approvedPrice: 3200 })
      .expect(201);
    const rejectAfterAccept = await request(adminApp)
      .post(adminRejectPath(other.pendingOrderRequest.id))
      .send({})
      .expect(409);
    expect(rejectAfterAccept.body.error.code).toBe("REQUEST_NOT_PENDING");
    expect(dataRepository.orders).toHaveLength(1);
  });

  it("creates only one Order for simulated concurrent double acceptance", async () => {
    const responses = await Promise.all([
      request(adminApp).post(adminAcceptPath(requestId)).send({ approvedPrice: 4500 }),
      request(adminApp).post(adminAcceptPath(requestId)).send({ approvedPrice: 4500 }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(dataRepository.orders).toHaveLength(1);
    expect(dataRepository.pendingOrderRequests[0].status).toBe("ACCEPTED");
  });

  it("returns 404 for a nonexistent request id", async () => {
    const acceptResponse = await request(adminApp)
      .post(adminAcceptPath(randomUUID()))
      .send({ approvedPrice: 4500 })
      .expect(404);
    const rejectResponse = await request(adminApp)
      .post(adminRejectPath(randomUUID()))
      .send({})
      .expect(404);

    expect(rejectResponse.body.error).toEqual(acceptResponse.body.error);
    expect(dataRepository.orders).toHaveLength(0);
  });

  it("refuses unauthenticated and Customer decisions", async () => {
    const anonymousApp = createApp({ dataRepository, imageStorage });
    await request(anonymousApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(401);
    await request(anonymousApp).post(adminRejectPath(requestId)).send({}).expect(401);

    const customerAdminApp = createApp({
      dataRepository,
      imageStorage,
      authenticate: session(CUSTOMER_ID, "CUSTOMER"),
    });
    await request(customerAdminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(403);
    await request(customerAdminApp).post(adminRejectPath(requestId)).send({}).expect(403);

    await request(ownerApp)
      .post(customerAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(404);
    await request(ownerApp).post(customerRejectPath(requestId)).send({}).expect(404);
    expect(dataRepository.orders).toHaveLength(0);
  });

  it("exposes no PUT, PATCH, or DELETE on the decision routes", async () => {
    for (const path of [adminAcceptPath(requestId), adminRejectPath(requestId)]) {
      await request(adminApp).put(path).send({ approvedPrice: 4500 }).expect(404);
      await request(adminApp).patch(path).send({ approvedPrice: 4500 }).expect(404);
      await request(adminApp).delete(path).expect(404);
    }
    expect(dataRepository.orders).toHaveLength(0);
  });

  it("leaves Product and PublicDiscount unchanged", async () => {
    const productBefore = { ...dataRepository.products[0] };
    const discountBefore = { ...dataRepository.publicDiscount };

    await request(adminApp)
      .post(adminAcceptPath(requestId))
      .send({ approvedPrice: 4500 })
      .expect(201);

    expect(dataRepository.products[0]).toEqual(productBefore);
    expect(dataRepository.publicDiscount).toEqual(discountBefore);
  });

  it("keeps negotiation additions refused once a decision is recorded", async () => {
    await request(adminApp).post(adminRejectPath(requestId)).send({}).expect(200);

    const afterReject = await request(adminApp)
      .post(negotiationPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(409);
    expect(afterReject.body.error.code).toBe("REQUEST_NOT_PENDING");

    const other = await seedRequest(dataRepository, {
      customerId: OTHER_CUSTOMER_ID,
      productId: null,
      displayName: "Sana",
    });
    const otherId = other.pendingOrderRequest.id;
    await request(adminApp)
      .post(adminAcceptPath(otherId))
      .send({ approvedPrice: 3200 })
      .expect(201);

    const afterAccept = await request(adminApp)
      .post(negotiationPath(otherId))
      .send({ proposedPrice: 100 })
      .expect(409);
    expect(afterAccept.body.error.code).toBe("REQUEST_NOT_PENDING");
    expect(dataRepository.negotiationEntries).toHaveLength(0);
  });
});

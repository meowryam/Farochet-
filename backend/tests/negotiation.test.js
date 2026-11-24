import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createInMemoryImageStorage } from "../src/data-access/storage/inMemoryImageStorage.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const RAAZIA_ID = "33333333-3333-4333-8333-333333333333";
const PRODUCT_ID = "44444444-4444-4444-8444-444444444444";

const adminPath = (id) => `/api/admin/customization/requests/${id}/negotiation`;
const customerPath = (id) => `/api/customer/customization/requests/${id}/negotiation`;

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

describe("Quotation & Price Negotiation API (FR-12, FR-13; ADR-005)", () => {
  let dataRepository;
  let imageStorage;
  let seeded;
  let requestId;
  let adminApp;
  let ownerApp;
  let otherApp;

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
    otherApp = createApp({
      dataRepository,
      imageStorage,
      authenticateCustomer: session(OTHER_CUSTOMER_ID, "CUSTOMER"),
    });
  });

  it("records multiple rounds by both parties in chronological order without overwriting earlier entries", async () => {
    const first = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 4500 })
      .expect(201);
    const second = await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 4200, note: "Could you consider this?" })
      .expect(201);
    const third = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 4300 })
      .expect(201);

    const history = await request(ownerApp).get(customerPath(requestId)).expect(200);
    expect(history.body.entries).toHaveLength(3);
    expect(history.body.entries.map((entry) => [entry.proposer, entry.proposedPrice])).toEqual([
      ["RAAZIA", 4500],
      ["CUSTOMER", 4200],
      ["RAAZIA", 4300],
    ]);
    expect(history.body.entries[0]).toEqual(first.body.entry);
    expect(history.body.entries[1]).toEqual(second.body.entry);
    expect(history.body.entries[2]).toEqual(third.body.entry);

    const timestamps = history.body.entries.map((entry) => Date.parse(entry.createdAt));
    expect(timestamps).toEqual([...timestamps].sort((left, right) => left - right));
  });

  it("accepts a positive whole-PKR price and trims an optional note", async () => {
    const response = await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 3200, note: "  gift order  " })
      .expect(201);

    expect(response.body.entry).toMatchObject({
      proposer: "CUSTOMER",
      proposedPrice: 3200,
      note: "gift order",
    });
    expect(response.body.entry).toHaveProperty("createdAt");
  });

  it("stores a null note when none is supplied", async () => {
    const response = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(201);
    expect(response.body.entry.note).toBeNull();
  });

  it.each([
    ["zero", 0],
    ["negative", -5],
    ["fractional", 10.5],
    ["string", "4500"],
  ])("rejects a %s proposed price", async (_label, proposedPrice) => {
    const response = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice })
      .expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a missing proposed price", async () => {
    const response = await request(adminApp)
      .post(adminPath(requestId))
      .send({ note: "no price" })
      .expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a note longer than 500 characters", async () => {
    const response = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100, note: "x".repeat(501) })
      .expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects client-supplied proposer or customer identity fields", async () => {
    await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100, proposer: "CUSTOMER" })
      .expect(400);
    await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100, customerId: CUSTOMER_ID })
      .expect(400);
    expect(dataRepository.negotiationEntries).toHaveLength(0);
  });

  it("derives the proposer from the signed-in viewer's role", async () => {
    const customerEntry = await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(201);
    const raaziaEntry = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 200 })
      .expect(201);

    expect(customerEntry.body.entry.proposer).toBe("CUSTOMER");
    expect(raaziaEntry.body.entry.proposer).toBe("RAAZIA");
  });

  it("lets Raazia read and add entries for any customization", async () => {
    await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(201);

    const history = await request(adminApp).get(adminPath(requestId)).expect(200);
    expect(history.body.entries).toHaveLength(1);
    expect(history.body.entries[0].proposer).toBe("RAAZIA");
  });

  it("lets the owning customer read and add entries", async () => {
    await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(201);

    const history = await request(ownerApp).get(customerPath(requestId)).expect(200);
    expect(history.body.entries).toHaveLength(1);
    expect(history.body.entries[0].proposer).toBe("CUSTOMER");
  });

  it("gives a non-owner and an unknown id the same 404 for read and add", async () => {
    const missing = await request(adminApp).get(adminPath(randomUUID())).expect(404);
    const otherRead = await request(otherApp).get(customerPath(requestId)).expect(404);
    const otherAdd = await request(otherApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(404);

    expect(otherRead.body.error).toEqual(missing.body.error);
    expect(otherAdd.body.error).toEqual(missing.body.error);
    expect(dataRepository.negotiationEntries).toHaveLength(0);
  });

  it("refuses unauthenticated negotiation reads and adds", async () => {
    const anonymousApp = createApp({ dataRepository, imageStorage });

    await request(anonymousApp).get(customerPath(requestId)).expect(401);
    await request(anonymousApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(401);
    await request(anonymousApp).get(adminPath(requestId)).expect(401);
    await request(anonymousApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(401);
  });

  it("refuses new entries when the pending request is no longer PENDING", async () => {
    // Test fixture only: any non-PENDING stored status proves the guard.
    dataRepository.pendingOrderRequests[0].status = "ACCEPTED";

    const adminResponse = await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(409);
    const customerResponse = await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(409);

    expect(adminResponse.body.error.code).toBe("REQUEST_NOT_PENDING");
    expect(customerResponse.body.error.code).toBe("REQUEST_NOT_PENDING");
    expect(dataRepository.negotiationEntries).toHaveLength(0);
  });

  it("exposes no PUT, PATCH, or DELETE route for negotiation entries", async () => {
    await request(adminApp)
      .put(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(404);
    await request(adminApp)
      .patch(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(404);
    await request(adminApp).delete(adminPath(requestId)).expect(404);

    await request(ownerApp)
      .put(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(404);
    await request(ownerApp)
      .patch(customerPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(404);
    await request(ownerApp).delete(customerPath(requestId)).expect(404);

    expect(dataRepository.negotiationEntries).toHaveLength(0);
  });

  it("returns the Standard Catalogue Price as the quotation reference when no discount is active", async () => {
    const history = await request(ownerApp).get(customerPath(requestId)).expect(200);
    expect(history.body.quotation).toEqual({
      standardCataloguePrice: 5000,
      publicPrice: null,
    });
  });

  it("returns the discounted public price using the fixed whole-rupee discount", async () => {
    dataRepository.publicDiscount.active = true;
    dataRepository.publicDiscount.fixedDiscountAmount = 750;

    const history = await request(adminApp).get(adminPath(requestId)).expect(200);
    expect(history.body.quotation).toEqual({
      standardCataloguePrice: 5000,
      publicPrice: 4250,
    });
  });

  it("returns null reference prices when the inquiry has no product or the product is missing", async () => {
    const noProduct = await seedRequest(dataRepository, {
      customerId: OTHER_CUSTOMER_ID,
      productId: null,
    });
    const missingProduct = await seedRequest(dataRepository, {
      customerId: OTHER_CUSTOMER_ID,
      productId: randomUUID(),
    });

    const noProductResponse = await request(adminApp)
      .get(adminPath(noProduct.pendingOrderRequest.id))
      .expect(200);
    const missingProductResponse = await request(adminApp)
      .get(adminPath(missingProduct.pendingOrderRequest.id))
      .expect(200);

    expect(noProductResponse.body.quotation).toEqual({
      standardCataloguePrice: null,
      publicPrice: null,
    });
    expect(missingProductResponse.body.quotation).toEqual({
      standardCataloguePrice: null,
      publicPrice: null,
    });
  });

  it("does not change the Product price, request status, or create an Order when adding entries", async () => {
    const productBefore = { ...dataRepository.products[0] };

    await request(adminApp)
      .post(adminPath(requestId))
      .send({ proposedPrice: 100 })
      .expect(201);
    await request(ownerApp)
      .post(customerPath(requestId))
      .send({ proposedPrice: 90 })
      .expect(201);

    expect(dataRepository.products[0]).toEqual(productBefore);
    expect(dataRepository.pendingOrderRequests[0].status).toBe("PENDING");
    expect(dataRepository.orders).toHaveLength(0);
    expect(dataRepository).not.toHaveProperty("createOrder");
  });
});

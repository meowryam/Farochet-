import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createInquiryManagement } from "../src/business-logic/inquiry/index.js";

function createMemoryRepository() {
  const products = [];
  const inquiries = [];

  return {
    products,
    inquiries,

    async findProductById(id) {
      return products.find((product) => product.id === id) ?? null;
    },

    async listInquiries() {
      return [...inquiries]
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((inquiry) => withProduct(inquiry));
    },

    async findInquiryById(id) {
      const inquiry = inquiries.find((item) => item.id === id);
      return inquiry ? withProduct(inquiry) : null;
    },
  };

  function withProduct(inquiry) {
    const product = inquiry.productId
      ? products.find((item) => item.id === inquiry.productId) ?? null
      : null;
    return { ...inquiry, product: product ? { name: product.name } : null };
  }
}

async function seedProduct(dataRepository, name) {
  const product = { id: randomUUID(), name };
  dataRepository.products.push(product);
  return product;
}

async function seedInquiry(dataRepository, overrides = {}) {
  const inquiry = {
    id: randomUUID(),
    customerId: randomUUID(),
    productId: null,
    message: "Could you tell me about customization options?",
    createdAt: new Date(),
    ...overrides,
  };
  dataRepository.inquiries.push(inquiry);
  return inquiry;
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

describe("Inquiry Review & Management API", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({ dataRepository, authenticate: raaziaSession });
  });

  it("returns an empty list when no inquiries have been saved", async () => {
    await request(app)
      .get("/api/admin/inquiries")
      .expect(200)
      .expect(({ body }) => expect(body.inquiries).toEqual([]));
  });

  it("returns linked and unlinked product names in list and detail responses", async () => {
    const product = await seedProduct(dataRepository, "Crochet rose");
    const linked = await seedInquiry(dataRepository, { productId: product.id, message: "Is this available?" });
    const unlinked = await seedInquiry(dataRepository, { message: "Can you make a custom piece?" });

    const list = await request(app).get("/api/admin/inquiries").expect(200);
    expect(list.body.inquiries).toHaveLength(2);
    expect(list.body.inquiries.find((item) => item.id === linked.id)).toMatchObject({
      customerId: linked.customerId,
      message: linked.message,
      productName: product.name,
    });
    expect(list.body.inquiries.find((item) => item.id === unlinked.id)).toMatchObject({
      customerId: unlinked.customerId,
      message: unlinked.message,
      productName: null,
    });

    await request(app)
      .get(`/api/admin/inquiries/${linked.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.inquiry.productName).toBe(product.name));
    await request(app)
      .get(`/api/admin/inquiries/${unlinked.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.inquiry.productName).toBeNull());
  });

  it("rejects malformed inquiry identifiers", async () => {
    await request(app).get("/api/admin/inquiries/not-a-uuid").expect(400);
  });

  it("returns 404 for a well-formed but missing inquiry", async () => {
    await request(app).get(`/api/admin/inquiries/${randomUUID()}`).expect(404);
  });

  it("rejects requests without authentication", async () => {
    const unauthenticatedApp = createApp({ dataRepository });

    await request(unauthenticatedApp)
      .get("/api/admin/inquiries")
      .set("x-user-role", "RAAZIA")
      .set("x-user-id", "forged-user-id")
      .expect(401);
  });

  it("does not allow a Customer session to review inquiries", async () => {
    const customerApp = createApp({ dataRepository, authenticate: customerSession() });

    await request(customerApp).get("/api/admin/inquiries").expect(403);
    await request(customerApp).get(`/api/admin/inquiries/${randomUUID()}`).expect(403);
  });
});

describe("Inquiry Management ownership", () => {
  it("lets Raazia read any inquiry but denies a Customer reading another Customer's inquiry", async () => {
    const dataRepository = createMemoryRepository();
    const customerA = randomUUID();
    const customerB = randomUUID();
    const ownedByA = await seedInquiry(dataRepository, { customerId: customerA });
    const ownedByB = await seedInquiry(dataRepository, { customerId: customerB });
    const inquiryManagement = createInquiryManagement({ repository: dataRepository });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: customerA, role: "CUSTOMER" }, ownedByB.id),
    ).rejects.toMatchObject({ status: 403, code: "INQUIRY_ACCESS_DENIED" });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: customerA, role: "CUSTOMER" }, ownedByA.id),
    ).resolves.toMatchObject({ id: ownedByA.id, customerId: customerA });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: "raazia-test-user", role: "RAAZIA" }, ownedByB.id),
    ).resolves.toMatchObject({ id: ownedByB.id, customerId: customerB });
  });
});

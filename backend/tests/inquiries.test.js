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

    async getPublicDiscount() {
      return null;
    },

    async createInquiry(data) {
      const inquiry = { id: randomUUID(), createdAt: new Date(), ...data };
      inquiries.push(inquiry);
      return inquiry;
    },

    async listInquiries() {
      return [...inquiries]
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((inquiry) => withAdminRelations(inquiry));
    },

    async findInquiryById(id) {
      const inquiry = inquiries.find((item) => item.id === id);
      return inquiry ? withProduct(inquiry) : null;
    },

    async findAdminInquiryById(id) {
      const inquiry = inquiries.find((item) => item.id === id);
      return inquiry ? withAdminRelations(inquiry) : null;
    },

    async createInquiry(data) {
      const inquiry = {
        id: randomUUID(),
        ...data,
        createdAt: new Date(),
      };
      inquiries.push(inquiry);
      return withProduct(inquiry);
    },

    async listInquiriesByCustomer(customerId) {
      return inquiries
        .filter((inquiry) => inquiry.customerId === customerId)
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((inquiry) => withProduct(inquiry));
    },
  };

  function withProduct(inquiry) {
    const product = inquiry.productId
      ? products.find((item) => item.id === inquiry.productId) ?? null
      : null;
    return { ...inquiry, product: product ? { name: product.name } : null };
  }

  function withAdminRelations(inquiry) {
    return { ...withProduct(inquiry), customer: inquiry.customer ?? null };
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

  it("returns available customer identity in Admin list and detail responses", async () => {
    const inquiry = await seedInquiry(dataRepository, {
      customer: { displayName: "Amina Example", email: "amina@example.test" },
    });

    const list = await request(app).get("/api/admin/inquiries").expect(200);
    expect(list.body.inquiries[0]).toMatchObject({
      customerId: inquiry.customerId,
      customerName: "Amina Example",
      customerEmail: "amina@example.test",
    });

    const detail = await request(app)
      .get(`/api/admin/inquiries/${inquiry.id}`)
      .expect(200);
    expect(detail.body.inquiry).toMatchObject({
      customerId: inquiry.customerId,
      customerName: "Amina Example",
      customerEmail: "amina@example.test",
    });
  });

  it("returns null customer identity fields when the profile is missing or incomplete", async () => {
    const inquiry = await seedInquiry(dataRepository, {
      customer: { displayName: " ", email: null },
    });

    const response = await request(app)
      .get(`/api/admin/inquiries/${inquiry.id}`)
      .expect(200);

    expect(response.body.inquiry).toMatchObject({
      customerId: inquiry.customerId,
      customerName: null,
      customerEmail: null,
    });
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

  it("lets a Customer submit an Inquiry linked to a listed Product", async () => {
    const product = await seedProduct(dataRepository, "Crochet rose");
    const customerApp = createApp({
      dataRepository,
      authenticateCustomer: customerSession(),
    });

    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ productId: product.id, message: "Could you share more details?" })
      .expect(201)
      .expect(({ body }) => {
        expect(body.inquiry).toMatchObject({
          id: expect.any(String),
          productId: product.id,
          customerId: "customer-test-user",
          message: "Could you share more details?",
        });
      });
    expect(dataRepository.inquiries).toHaveLength(1);
    expect(dataRepository.inquiries[0].customerId).toBe("customer-test-user");
  });

  it("rejects an empty inquiry and unknown product reference", async () => {
    const customerApp = createApp({
      dataRepository,
      authenticateCustomer: customerSession(),
    });

    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ message: "  " })
      .expect(400);
    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ productId: randomUUID(), message: "Is this product available?" })
      .expect(404);
    expect(dataRepository.inquiries).toHaveLength(0);
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
    const ownedByB = await seedInquiry(dataRepository, {
      customerId: customerB,
      customer: { displayName: "Customer B", email: "customer-b@example.test" },
    });
    const inquiryManagement = createInquiryManagement({ repository: dataRepository });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: customerA, role: "CUSTOMER" }, ownedByB.id),
    ).rejects.toMatchObject({ status: 403, code: "INQUIRY_ACCESS_DENIED" });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: customerA, role: "CUSTOMER" }, ownedByA.id),
    ).resolves.toMatchObject({ id: ownedByA.id, customerId: customerA });

    await expect(
      inquiryManagement.getInquiryForViewer({ id: "raazia-test-user", role: "RAAZIA" }, ownedByB.id),
    ).resolves.toMatchObject({
      id: ownedByB.id,
      customerId: customerB,
      customerName: "Customer B",
      customerEmail: "customer-b@example.test",
    });
  });
});

describe("Customer inquiry submission", () => {
  let dataRepository;
  let customerApp;
  const customerId = randomUUID();

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    customerApp = createApp({
      dataRepository,
      authenticateCustomer: customerSession(customerId),
    });
  });

  it("allows an authenticated customer to submit a general inquiry", async () => {
    const response = await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ message: "  Do you make custom flower bouquets?  " })
      .expect(201);

    expect(response.body.inquiry).toMatchObject({
      customerId,
      message: "Do you make custom flower bouquets?",
      productName: null,
    });
  });

  it("allows an optional valid product reference", async () => {
    const product = await seedProduct(dataRepository, "Crochet rose");
    const response = await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ productId: product.id, message: "Is this available in pink?" })
      .expect(201);

    expect(response.body.inquiry).toMatchObject({
      customerId,
      productName: "Crochet rose",
      message: "Is this available in pink?",
    });
  });

  it("rejects an empty message and client-supplied customer identity", async () => {
    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ message: "   " })
      .expect(400);

    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ customerId: randomUUID(), message: "Please help" })
      .expect(400);
  });

  it("rejects inquiry messages longer than 5,000 characters", async () => {
    const response = await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ message: "x".repeat(5001) })
      .expect(400);

    expect(response.body.error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Inquiry message must be 5,000 characters or fewer.",
    });
    expect(dataRepository.inquiries).toHaveLength(0);
  });

  it("rejects unknown product references", async () => {
    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ productId: randomUUID(), message: "Is this available?" })
      .expect(404)
      .expect(({ body }) => expect(body.error.code).toBe("PRODUCT_NOT_FOUND"));
  });

  it("rejects archived product references", async () => {
    const product = await seedProduct(dataRepository, "Archived flower");
    product.isArchived = true;

    await request(customerApp)
      .post("/api/customer/inquiries")
      .send({ productId: product.id, message: "Is this available?" })
      .expect(404)
      .expect(({ body }) => expect(body.error.code).toBe("PRODUCT_NOT_FOUND"));
  });

  it("requires authentication and returns only the current customer's history", async () => {
    await seedInquiry(dataRepository, {
      customerId,
      customer: { displayName: "Private Customer", email: "private@example.test" },
    });
    await seedInquiry(dataRepository, { customerId: randomUUID() });

    await request(createApp({ dataRepository }))
      .post("/api/customer/inquiries")
      .send({ message: "Please help" })
      .expect(401);

    const history = await request(customerApp)
      .get(`/api/customer/inquiries?customerId=${randomUUID()}`)
      .expect(200);
    expect(history.body.inquiries).toHaveLength(1);
    expect(history.body.inquiries[0].customerId).toBe(customerId);
    expect(history.body.inquiries[0]).not.toHaveProperty("customerName");
    expect(history.body.inquiries[0]).not.toHaveProperty("customerEmail");

    const foreign = await seedInquiry(dataRepository, { customerId: randomUUID() });
    await request(customerApp)
      .get(`/api/customer/inquiries/${foreign.id}`)
      .expect(403);

    const ownedDetail = await request(customerApp)
      .get(`/api/customer/inquiries/${dataRepository.inquiries[0].id}`)
      .expect(200);
    expect(ownedDetail.body.inquiry).not.toHaveProperty("customerName");
    expect(ownedDetail.body.inquiry).not.toHaveProperty("customerEmail");
  });

  it("rejects unauthenticated customer inquiry history and detail requests", async () => {
    const unauthenticatedApp = createApp({ dataRepository });

    await request(unauthenticatedApp)
      .get("/api/customer/inquiries")
      .expect(401);
    await request(unauthenticatedApp)
      .get(`/api/customer/inquiries/${randomUUID()}`)
      .expect(401);
  });
});

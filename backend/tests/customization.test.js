import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createInMemoryImageStorage } from "../src/data-access/storage/inMemoryImageStorage.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
const RAAZIA_ID = "33333333-3333-4333-8333-333333333333";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function createMemoryRepository() {
  const inquiries = [];
  const customizations = [];
  const pendingOrderRequests = [];
<<<<<<< HEAD
  const users = new Map();
  const orders = [];

  function decorate(request) {
    const customization = customizations.find((item) => item.id === request.customizationId) ?? null;
    const inquiry = inquiries.find((item) => item.id === customization?.inquiryId) ?? null;
    const user = users.get(inquiry?.customerId) ?? null;

    return {
      id: request.id,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      customization: customization ? { ...customization } : null,
      inquiry: inquiry ? {
        id: inquiry.id,
        message: inquiry.message,
        createdAt: inquiry.createdAt,
        customerId: inquiry.customerId,
        customer: user ? { id: user.id, displayName: user.displayName } : null,
      } : null,
    };
  }
=======
  const products = [];
>>>>>>> 9a9ecf1 (c4m1)

  return {
    inquiries,
    customizations,
    pendingOrderRequests,
<<<<<<< HEAD
    users,
    orders,
=======
    products,

    async findProductById(id) {
      return products.find((product) => product.id === id) ?? null;
    },

    async getPublicDiscount() {
      return null;
    },
>>>>>>> 9a9ecf1 (c4m1)

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

    async listPendingCustomizationRequests() {
      return pendingOrderRequests
        .filter((request) => request.status === "PENDING")
        .slice()
        .sort((left, right) => right.createdAt - left.createdAt)
        .map(decorate);
    },

    async findCustomizationRequestById(id) {
      const request = pendingOrderRequests.find((item) => item.id === id);
      return request ? decorate(request) : null;
    },

    async findCustomizationByReferenceImage(imagePath) {
      const customization = customizations.find((item) => item.referenceImages?.includes(imagePath));
      if (!customization) return null;
      const inquiry = inquiries.find((item) => item.id === customization.inquiryId);
      return {
        id: customization.id,
        inquiry: inquiry ? { customerId: inquiry.customerId } : null,
      };
    },
  };
}

function image(overrides = {}) {
  return {
    name: "reference.png",
    contentType: "image/png",
    sizeBytes: 16,
    base64: Buffer.from("tiny-image-data").toString("base64"),
    ...overrides,
  };
}

function validBody(overrides = {}) {
  return {
    productType: "Crochet rose bouquet",
    quantity: 2,
    size: "30 cm",
    colour: "Ivory",
    materials: "Cotton yarn",
    budget: "5000 PKR",
    specialInstructions: "Please match the reference photo.",
    requiredCompletionDate: "2026-12-20",
    deliveryAddress: "Lahore",
    referenceImages: [image()],
    ...overrides,
  };
}

async function seedReviewRequest(
  dataRepository,
  imageStorage,
  {
    customerId = CUSTOMER_ID,
    displayName = "Ayesha",
    productType = "Crochet rose bouquet",
    message = "Please match the reference photo.",
    createdAt = new Date(),
  } = {},
) {
  const stored = await imageStorage.storeImages({ customerId, images: [image()] });
  const created = await dataRepository.createCustomizationRequest({
    inquiry: { customerId, message },
    customization: {
      productType,
      size: "30 cm",
      colour: "Ivory",
      materials: "Cotton yarn",
      quantity: 2,
      budget: "5000 PKR",
      specialInstructions: message,
      requiredCompletionDate: new Date("2026-12-20"),
      deliveryAddress: "Lahore",
      referenceImages: stored.map((storedImage) => storedImage.path),
    },
  });

  created.pendingOrderRequest.createdAt = createdAt;
  dataRepository.users.set(customerId, { id: customerId, displayName });
  return created;
}

function session(userId, role) {
  return function sessionMiddleware(req, _res, next) {
    req.authenticatedUser = { id: userId, role };
    next();
  };
}

describe("Customization Request Submission API (FR-09)", () => {
  let dataRepository;
  let imageStorage;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    imageStorage = createInMemoryImageStorage();
    app = createApp({
      dataRepository,
      imageStorage,
      authenticate: session(CUSTOMER_ID, "CUSTOMER"),
    });
  });

  it("submits a valid request and preserves the Inquiry -> Customization -> PendingOrderRequest chain", async () => {
    const body = validBody();
    const response = await request(app)
      .post("/api/customer/customization/requests")
      .send(body)
      .expect(201);

    expect(response.body.customization).toMatchObject({
      id: expect.any(String),
      inquiryId: expect.any(String),
      productType: body.productType,
      quantity: body.quantity,
      size: body.size,
      colour: body.colour,
      materials: body.materials,
      budget: body.budget,
      specialInstructions: body.specialInstructions,
      deliveryAddress: body.deliveryAddress,
    });
    expect(response.body.customization.referenceImages).toHaveLength(1);

    expect(dataRepository.inquiries).toHaveLength(1);
    expect(dataRepository.inquiries[0]).toMatchObject({
      id: response.body.customization.inquiryId,
      customerId: CUSTOMER_ID,
      message: body.specialInstructions,
    });

    expect(response.body.pendingOrderRequest).toMatchObject({
      id: expect.any(String),
      customizationId: response.body.customization.id,
      status: "PENDING",
    });
    expect(response.body.pendingOrderRequest).not.toHaveProperty("inquiryId");
    expect(dataRepository.pendingOrderRequests).toHaveLength(1);
  });

  it("accepts a request without optional details", async () => {
    const response = await request(app)
      .post("/api/customer/customization/requests")
      .send({ productType: "Crochet rose", quantity: 1 })
      .expect(201);

    expect(response.body.customization).toMatchObject({
      productType: "Crochet rose",
      quantity: 1,
      referenceImages: [],
    });
    expect(dataRepository.inquiries[0].message).toBe("");
  });

  it("keeps a catalogue-based custom request linked to its Product through the Inquiry", async () => {
    const product = { id: randomUUID(), name: "Crochet rose", isArchived: false, basePrice: 1000 };
    dataRepository.products.push(product);

    const response = await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({ productId: product.id }))
      .expect(201);

    expect(dataRepository.inquiries[0]).toMatchObject({
      id: response.body.customization.inquiryId,
      productId: product.id,
    });
    expect(response.body.customization).not.toHaveProperty("productId");
    expect(response.body.pendingOrderRequest).not.toHaveProperty("inquiryId");
  });

  it("rejects a missing product type", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({ productType: undefined }))
      .expect(400);
  });

  it("rejects a quantity below 1", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({ quantity: 0 }))
      .expect(400);
  });

  it("rejects an unsupported image type", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({ referenceImages: [image({ contentType: "image/gif" })] }))
      .expect(400);
  });

  it("rejects an image over 2 MB", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({
        referenceImages: [image({ sizeBytes: MAX_IMAGE_BYTES + 1 })],
      }))
      .expect(400);
  });

  it("rejects more than 5 images", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({
        referenceImages: Array.from({ length: 6 }, () => image()),
      }))
      .expect(400);
  });

  it("ignores a client-supplied owner identifier", async () => {
    await request(app)
      .post("/api/customer/customization/requests")
      .send(validBody({ customerId: randomUUID() }))
      .expect(400);

    expect(dataRepository.customizations).toHaveLength(0);
  });

  it("rejects a Raazia session", async () => {
    const adminApp = createApp({
      dataRepository,
      imageStorage,
      authenticate: session(CUSTOMER_ID, "RAAZIA"),
    });

    await request(adminApp)
      .post("/api/customer/customization/requests")
      .send(validBody())
      .expect(403);
  });

  it("rejects an unauthenticated request", async () => {
    const anonymousApp = createApp({ dataRepository, imageStorage });

    await request(anonymousApp)
      .post("/api/customer/customization/requests")
      .send(validBody())
      .expect(401);
  });
});

describe("Customization Request Review API (FR-10)", () => {
  let dataRepository;
  let imageStorage;
  let seeded;
  let adminApp;
  let ownerApp;
  let otherApp;
  let imagePath;

  beforeEach(async () => {
    dataRepository = createMemoryRepository();
    imageStorage = createInMemoryImageStorage();
    seeded = await seedReviewRequest(dataRepository, imageStorage);
    imagePath = seeded.customization.referenceImages[0];

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

  it("lists pending requests for Raazia, newest first, with customer name and stored status", async () => {
    await seedReviewRequest(dataRepository, imageStorage, {
      customerId: OTHER_CUSTOMER_ID,
      displayName: "Sana",
      productType: "Crochet table runner",
      createdAt: new Date(Date.now() - 60_000),
    });

    const response = await request(adminApp)
      .get("/api/admin/customization/requests")
      .expect(200);

    expect(response.body.requests).toHaveLength(2);
    expect(response.body.requests[0]).toMatchObject({
      id: seeded.pendingOrderRequest.id,
      status: "PENDING",
      customization: {
        productType: seeded.customization.productType,
        materials: seeded.customization.materials,
        quantity: seeded.customization.quantity,
      },
      inquiry: {
        message: seeded.inquiry.message,
        customer: { displayName: "Ayesha" },
      },
    });
    expect(response.body.requests[1].inquiry.customer.displayName).toBe("Sana");
  });

  it("opens a request in detail for Raazia with all submitted information", async () => {
    const response = await request(adminApp)
      .get(`/api/admin/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(200);

    const { request: detail } = response.body;
    expect(detail).toMatchObject({
      id: seeded.pendingOrderRequest.id,
      status: "PENDING",
      customization: {
        id: seeded.customization.id,
        inquiryId: seeded.inquiry.id,
        productType: seeded.customization.productType,
        size: "30 cm",
        colour: "Ivory",
        materials: "Cotton yarn",
        quantity: 2,
        budget: "5000 PKR",
        specialInstructions: seeded.inquiry.message,
        deliveryAddress: "Lahore",
        referenceImages: [imagePath],
      },
      inquiry: {
        id: seeded.inquiry.id,
        message: seeded.inquiry.message,
        customer: { displayName: "Ayesha" },
      },
    });
    expect(detail.customization).toHaveProperty("requiredCompletionDate");
    expect(detail.customization).not.toHaveProperty("feasibility");
    expect(detail.customization).not.toHaveProperty("decision");
  });

  it("returns the safe not-found error for a nonexistent request", async () => {
    const response = await request(adminApp)
      .get(`/api/admin/customization/requests/${randomUUID()}`)
      .expect(404);

    expect(response.body.error).toEqual({
      code: "CUSTOMIZATION_REQUEST_NOT_FOUND",
      message: "Customization request was not found.",
    });
  });

  it("rejects a malformed request id", async () => {
    const response = await request(adminApp)
      .get("/api/admin/customization/requests/not-a-uuid")
      .expect(400);

    expect(response.body.error.code).toBe("INVALID_CUSTOMIZATION_ID");
  });

  it("gives Raazia access to a stored reference image without a public URL", async () => {
    const response = await request(adminApp)
      .get("/api/admin/customization/images")
      .query({ path: imagePath })
      .expect(200);

    expect(response.body.image).toMatchObject({
      path: imagePath,
      contentType: "image/png",
      sizeBytes: 16,
    });
    expect(response.body.image).toHaveProperty("base64");
    expect(response.body.image).not.toHaveProperty("url");
    expect(response.body.image).not.toHaveProperty("publicUrl");
  });

  it("gives the owning customer access to their own reference image", async () => {
    const response = await request(ownerApp)
      .get("/api/customer/customization/images")
      .query({ path: imagePath })
      .expect(200);

    expect(response.body.image).toMatchObject({ path: imagePath });
    expect(response.body.image).not.toHaveProperty("url");
  });

  it("returns 404 when a recorded reference image has no stored bytes", async () => {
    const emptyImageStorage = createInMemoryImageStorage();
    const emptyAdminApp = createApp({
      dataRepository,
      imageStorage: emptyImageStorage,
      authenticate: session(RAAZIA_ID, "RAAZIA"),
    });
    const emptyOwnerApp = createApp({
      dataRepository,
      imageStorage: emptyImageStorage,
      authenticateCustomer: session(CUSTOMER_ID, "CUSTOMER"),
    });

    const adminResponse = await request(emptyAdminApp)
      .get("/api/admin/customization/images")
      .query({ path: imagePath })
      .expect(404);
    const customerResponse = await request(emptyOwnerApp)
      .get("/api/customer/customization/images")
      .query({ path: imagePath })
      .expect(404);

    expect(adminResponse.body.error).toEqual({
      code: "CUSTOMIZATION_IMAGE_NOT_FOUND",
      message: "Reference image was not found.",
    });
    expect(customerResponse.body.error).toEqual(adminResponse.body.error);
  });

  it("refuses another customer's request detail and reference image with the same safe error", async () => {
    const detail = await request(otherApp)
      .get(`/api/customer/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(404);
    const missingDetail = await request(adminApp)
      .get(`/api/admin/customization/requests/${randomUUID()}`)
      .expect(404);
    const image = await request(otherApp)
      .get("/api/customer/customization/images")
      .query({ path: imagePath })
      .expect(404);

    expect(detail.body.error).toEqual(missingDetail.body.error);
    expect(image.body.error.code).toBe("CUSTOMIZATION_IMAGE_NOT_FOUND");
  });

  it("refuses unauthenticated review and detail requests", async () => {
    const anonymousApp = createApp({ dataRepository, imageStorage });

    await request(anonymousApp)
      .get("/api/admin/customization/requests")
      .expect(401);
    await request(anonymousApp)
      .get(`/api/customer/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(401);
  });

  it("refuses the Raazia-only list for a customer", async () => {
    const customerAsAdminApp = createApp({
      dataRepository,
      imageStorage,
      authenticate: session(CUSTOMER_ID, "CUSTOMER"),
    });

    const response = await request(customerAsAdminApp)
      .get("/api/admin/customization/requests")
      .expect(403);

    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("review access never changes the stored status and never creates an Order", async () => {
    await request(adminApp).get("/api/admin/customization/requests").expect(200);
    await request(adminApp)
      .get(`/api/admin/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(200);
    await request(adminApp)
      .get("/api/admin/customization/images")
      .query({ path: imagePath })
      .expect(200);

    expect(dataRepository.pendingOrderRequests).toHaveLength(1);
    expect(dataRepository.pendingOrderRequests[0].status).toBe("PENDING");
    expect(dataRepository.orders).toHaveLength(0);
    expect(dataRepository).not.toHaveProperty("createOrder");
  });

  it("exposes no delete route for a customization request or pending request", async () => {
    await request(adminApp)
      .delete(`/api/admin/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(404);
    await request(ownerApp)
      .delete(`/api/customer/customization/requests/${seeded.pendingOrderRequest.id}`)
      .expect(404);

    expect(dataRepository.customizations).toHaveLength(1);
    expect(dataRepository.pendingOrderRequests).toHaveLength(1);
  });
});

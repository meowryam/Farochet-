import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { createInMemoryImageStorage } from "../src/data-access/storage/inMemoryImageStorage.js";

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function createMemoryRepository() {
  const inquiries = [];
  const customizations = [];
  const pendingOrderRequests = [];

  return {
    inquiries,
    customizations,
    pendingOrderRequests,

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

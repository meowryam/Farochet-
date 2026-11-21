import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

function createMemoryRepository() {
  const products = [];

  return {
    products,
    async listProducts({ includeArchived = false } = {}) {
      return products
        .filter((product) => includeArchived || !product.isArchived)
        .sort((left, right) => left.createdAt - right.createdAt);
    },
    async findProductById(id) {
      return products.find((product) => product.id === id) ?? null;
    },
    async createProduct(data) {
      const now = new Date();
      const product = {
        id: randomUUID(),
        ...data,
        isArchived: false,
        createdAt: now,
        updatedAt: now,
      };
      products.push(product);
      return product;
    },
    async updateProduct(id, data) {
      const product = products.find((item) => item.id === id);
      Object.assign(product, data, { updatedAt: new Date() });
      return product;
    },
    async archiveProduct(id) {
      const product = products.find((item) => item.id === id);
      product.isArchived = true;
      product.updatedAt = new Date();
      return product;
    },
    async seedProducts(data) {
      return Promise.all(data.map((product) => this.createProduct(product)));
    },
  };
}

const validProduct = {
  name: "Crochet flower",
  description: "Handmade crochet flower.",
  category: "Decor",
  images: ["/images/crochet-flower.jpg"],
  basePrice: 1250,
};

function raaziaSession(_req, _res, next) {
  _req.authenticatedUser = { id: "raazia-test-user", role: "RAAZIA" };
  next();
}

describe("Product Catalogue Administration API", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({ dataRepository, authenticate: raaziaSession });
  });

  it("creates, retrieves, edits, and archives a product without deleting its record", async () => {
    const created = await request(app)
      .post("/api/admin/products")
      .send(validProduct)
      .expect(201);
    const id = created.body.product.id;

    expect(created.body.product).toMatchObject({
      name: validProduct.name,
      basePrice: validProduct.basePrice,
      isArchived: false,
    });

    await request(app)
      .get(`/api/admin/products/${id}`)
      .expect(200)
      .expect(({ body }) => expect(body.product.id).toBe(id));

    const changed = { ...validProduct, name: "Updated crochet flower", basePrice: 1600 };
    await request(app)
      .put(`/api/admin/products/${id}`)
      .send(changed)
      .expect(200)
      .expect(({ body }) => expect(body.product).toMatchObject(changed));

    await request(app)
      .patch(`/api/admin/products/${id}/archive`)
      .expect(200)
      .expect(({ body }) => expect(body.product.isArchived).toBe(true));

    expect(dataRepository.products).toHaveLength(1);
    await request(app)
      .get("/api/admin/products")
      .expect(200)
      .expect(({ body }) => expect(body.products[0].isArchived).toBe(true));
    await request(app)
      .put(`/api/admin/products/${id}`)
      .send(changed)
      .expect(409);
  });

  it.each([
    ["missing name", { ...validProduct, name: " " }],
    ["zero price", { ...validProduct, basePrice: 0 }],
    ["negative price", { ...validProduct, basePrice: -1 }],
    ["fractional price", { ...validProduct, basePrice: 1250.5 }],
  ])("rejects %s", async (_label, payload) => {
    await request(app)
      .post("/api/admin/products")
      .send(payload)
      .expect(400);
    expect(dataRepository.products).toHaveLength(0);
  });

  it("rejects malformed product identifiers", async () => {
    await request(app).get("/api/admin/products/not-a-uuid").expect(400);
  });

  it("rejects product availability states and per-product discount fields", async () => {
    await request(app)
      .post("/api/admin/products")
      .send({ ...validProduct, availabilityStatus: "AVAILABLE", discount: 100 })
      .expect(400);
    expect(dataRepository.products).toHaveLength(0);
  });

  it("does not allow a Customer session to manage products", async () => {
    const customerSession = (_req, _res, next) => {
      _req.authenticatedUser = { id: "customer-test-user", role: "CUSTOMER" };
      next();
    };
    const customerApp = createApp({ dataRepository, authenticate: customerSession });

    await request(customerApp)
      .post("/api/admin/products")
      .send(validProduct)
      .expect(403);
    expect(dataRepository.products).toHaveLength(0);
  });

  it("rejects requests without the temporary session token", async () => {
    const unauthenticatedApp = createApp({ dataRepository });

    await request(unauthenticatedApp)
      .get("/api/admin/products")
      .set("x-user-role", "RAAZIA")
      .set("x-user-id", "forged-user-id")
      .expect(401);
  });
});

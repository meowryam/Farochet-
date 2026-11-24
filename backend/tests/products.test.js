import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

function createMemoryRepository() {
  const products = [];
  let publicDiscount = null;

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
    async getPublicDiscount() {
      return publicDiscount;
    },
    async upsertPublicDiscount(data) {
      publicDiscount = {
        id: "current",
        active: data.active,
        fixedDiscountAmount: data.fixedDiscountAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return publicDiscount;
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

  it("rejects operations on missing products", async () => {
    const id = randomUUID();

    await request(app).get(`/api/admin/products/${id}`).expect(404);
    await request(app).put(`/api/admin/products/${id}`).send(validProduct).expect(404);
    await request(app).patch(`/api/admin/products/${id}/archive`).expect(404);
  });

  it("keeps a repeated archive operation idempotent", async () => {
    const created = await request(app)
      .post("/api/admin/products")
      .send(validProduct)
      .expect(201);

    await request(app)
      .patch(`/api/admin/products/${created.body.product.id}/archive`)
      .expect(200);
    await request(app)
      .patch(`/api/admin/products/${created.body.product.id}/archive`)
      .expect(200)
      .expect(({ body }) => expect(body.product.isArchived).toBe(true));
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

describe("Public Product Catalogue API", () => {
  let dataRepository;
  let app;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    app = createApp({ dataRepository, authenticate: raaziaSession });
  });

  it("lists only listed products without exposing administrative fields", async () => {
    const listed = await dataRepository.createProduct(validProduct);
    const archived = await dataRepository.createProduct({
      ...validProduct,
      name: "Archived flower",
    });
    await dataRepository.archiveProduct(archived.id);

    const response = await request(app)
      .get("/api/products")
      .expect(200);

    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]).toMatchObject({
      id: listed.id,
      name: validProduct.name,
      standardCataloguePrice: validProduct.basePrice,
      effectivePublicPrice: validProduct.basePrice,
      fixedDiscountAmount: null,
    });
    expect(response.body.products[0]).not.toHaveProperty("isArchived");
  });

  it("retrieves full listed product details and rejects archived or unknown products", async () => {
    const listed = await dataRepository.createProduct(validProduct);
    const archived = await dataRepository.createProduct({
      ...validProduct,
      name: "Archived flower",
    });
    await dataRepository.archiveProduct(archived.id);

    await request(app)
      .get(`/api/products/${listed.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.product).toMatchObject({
        id: listed.id,
        name: validProduct.name,
        description: validProduct.description,
        category: validProduct.category,
        images: validProduct.images,
        standardCataloguePrice: validProduct.basePrice,
        effectivePublicPrice: validProduct.basePrice,
        fixedDiscountAmount: null,
      }));

    await request(app).get(`/api/products/${archived.id}`).expect(404);
    await request(app).get(`/api/products/${randomUUID()}`).expect(404);
  });

  it("applies the active fixed public discount without changing the Standard Catalogue Price", async () => {
    const listed = await dataRepository.createProduct(validProduct);
    await dataRepository.upsertPublicDiscount({ active: true, fixedDiscountAmount: 200 });

    await request(app)
      .get(`/api/products/${listed.id}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.product).toMatchObject({
          standardCataloguePrice: 1250,
          effectivePublicPrice: 1050,
          fixedDiscountAmount: 200,
        });
        expect(body.product).not.toHaveProperty("basePrice");
        expect(body.product).not.toHaveProperty("negotiatedPrice");
        expect(body.product).not.toHaveProperty("approvedPrice");
        expect(body.product).not.toHaveProperty("negotiatedPriceSnapshot");
      });

    expect((await dataRepository.findProductById(listed.id)).basePrice).toBe(1250);
  });

  it("returns an empty optional-image list and preserves every supplied image", async () => {
    const noImage = await dataRepository.createProduct({ ...validProduct, images: [] });
    const multipleImages = await dataRepository.createProduct({
      ...validProduct,
      images: ["/images/front.jpg", "/images/back.jpg"],
    });

    await request(app)
      .get(`/api/products/${noImage.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.product.images).toEqual([]));

    await request(app)
      .get(`/api/products/${multipleImages.id}`)
      .expect(200)
      .expect(({ body }) => expect(body.product.images).toEqual([
        "/images/front.jpg",
        "/images/back.jpg",
      ]));
  });

  it("rejects malformed public product identifiers", async () => {
    await request(app).get("/api/products/not-a-uuid").expect(400);
  });

  it("does not require authentication for public catalogue retrieval", async () => {
    await dataRepository.createProduct(validProduct);

    await request(app)
      .get("/api/products")
      .expect(200);
  });
});

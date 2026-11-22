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
      return products.filter((product) => includeArchived || !product.isArchived);
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

function raaziaSession(req, _res, next) {
  req.authenticatedUser = { id: "raazia-test-user", role: "RAAZIA" };
  next();
}

describe("Pricing and Public Discount Management", () => {
  let repository;
  let app;

  beforeEach(() => {
    repository = createMemoryRepository();
    app = createApp({ dataRepository: repository, authenticate: raaziaSession });
  });

  async function addProduct(basePrice, name = `Product ${basePrice}`) {
    const response = await request(app)
      .post("/api/admin/products")
      .send({
        name,
        description: "",
        category: "Decor",
        images: [],
        basePrice,
      })
      .expect(201);
    return response.body.product;
  }

  it("activates, updates, and removes a uniform fixed discount without changing standard prices", async () => {
    const low = await addProduct(1000, "Low");
    await addProduct(2500, "High");

    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 200 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.active).toBe(true);
        expect(body.fixedDiscountAmount).toBe(200);
        expect(body.products).toHaveLength(2);
        expect(body.products.find((item) => item.id === low.id).effectivePublicPrice).toBe(800);
      });

    await request(app)
      .patch("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 300 })
      .expect(200)
      .expect(({ body }) => {
        expect(body.fixedDiscountAmount).toBe(300);
        expect(body.products.map((item) => item.standardCataloguePrice)).toEqual([1000, 2500]);
        expect(body.products.map((item) => item.effectivePublicPrice)).toEqual([700, 2200]);
      });

    await request(app)
      .delete("/api/admin/pricing/public-discount")
      .expect(200)
      .expect(({ body }) => {
        expect(body.active).toBe(false);
        expect(body.fixedDiscountAmount).toBeNull();
        expect(body.products.every((item) => item.effectivePublicPrice === item.standardCataloguePrice)).toBe(true);
      });

    expect((await repository.findProductById(low.id)).basePrice).toBe(1000);
  });

  it("applies boundary values correctly against the minimum listed price", async () => {
    await addProduct(1000);
    await addProduct(1500);

    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 999 })
      .expect(200);

    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 1000 })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe("PUBLIC_DISCOUNT_TOO_HIGH"));

    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 1001 })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe("PUBLIC_DISCOUNT_TOO_HIGH"));
  });

  it.each([0, -100, 50.5])("rejects invalid fixed discount %s", async (amount) => {
    await addProduct(1000);
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: amount })
      .expect(400);
  });

  it("rejects non-numeric and missing fixed discount values", async () => {
    await addProduct(1000);
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: "50" })
      .expect(400);
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({})
      .expect(400);
  });

  it("rejects sale activation when no products are listed", async () => {
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 100 })
      .expect(409)
      .expect(({ body }) => expect(body.error.code).toBe("NO_LISTED_PRODUCTS"));
  });

  it("rejects a standard price update below an active discount", async () => {
    const product = await addProduct(1000);
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 200 })
      .expect(200);

    await request(app)
      .put(`/api/admin/products/${product.id}`)
      .send({
        name: product.name,
        description: "",
        category: "Decor",
        images: [],
        basePrice: 200,
      })
      .expect(400)
      .expect(({ body }) => expect(body.error.code).toBe("STANDARD_PRICE_BELOW_ACTIVE_DISCOUNT"));

    expect((await repository.findProductById(product.id)).basePrice).toBe(1000);
  });

  it("allows public reads and applies the same discount to all listed products", async () => {
    await addProduct(1000);
    await addProduct(2500);
    await request(app)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 100 })
      .expect(200);

    await request(app)
      .get("/api/pricing/public")
      .expect(200)
      .expect(({ body }) => {
        expect(body.active).toBe(true);
        expect(body.fixedDiscountAmount).toBe(100);
        expect(body.products.map((item) => item.standardCataloguePrice - item.effectivePublicPrice))
          .toEqual([100, 100]);
      });
  });

  it("rejects Customer and unauthenticated discount mutations", async () => {
    await addProduct(1000);

    const customerApp = createApp({
      dataRepository: repository,
      authenticate: (req, _res, next) => {
        req.authenticatedUser = { id: "customer-test-user", role: "CUSTOMER" };
        next();
      },
    });
    await request(customerApp)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 100 })
      .expect(403);

    const unauthenticatedApp = createApp({ dataRepository: repository });
    await request(unauthenticatedApp)
      .put("/api/admin/pricing/public-discount")
      .send({ fixedDiscountAmount: 100 })
      .set("x-user-role", "RAAZIA")
      .set("x-user-id", "forged-user-id")
      .expect(401);
  });
});

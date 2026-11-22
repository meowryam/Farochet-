import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

function createMemoryRepository() {
  const products = [];
  const wishlistItems = [];

  return {
    products,
    wishlistItems,
    async findProductById(id) {
      return products.find((product) => product.id === id) ?? null;
    },
    async addWishlistItem({ customerId, productId }) {
      const existing = wishlistItems.find(
        (item) => item.customerId === customerId && item.productId === productId,
      );
      if (existing) return { item: existing, created: false };

      const item = {
        id: randomUUID(),
        customerId,
        productId,
        createdAt: new Date(),
      };
      wishlistItems.push(item);
      return { item, created: true };
    },
    async listWishlistItems(customerId) {
      return wishlistItems
        .filter((item) => item.customerId === customerId)
        .sort((left, right) => right.createdAt - left.createdAt)
        .map(({ id, productId, createdAt }) => ({ id, productId, createdAt }));
    },
    async removeWishlistItem({ customerId, productId }) {
      const index = wishlistItems.findIndex(
        (item) => item.customerId === customerId && item.productId === productId,
      );
      if (index < 0) return false;
      wishlistItems.splice(index, 1);
      return true;
    },
  };
}

const CUSTOMER_A = randomUUID();
const CUSTOMER_B = randomUUID();
const PRODUCT = {
  name: "Crochet flower",
  description: "Handmade crochet flower.",
  category: "Decor",
  images: ["/images/crochet-flower.jpg"],
  basePrice: 1250,
};

function customerSession(id) {
  return function authenticateCustomer(req, _res, next) {
    req.authenticatedUser = { id, role: "CUSTOMER" };
    next();
  };
}

function raaziaSession(req, _res, next) {
  req.authenticatedUser = { id: randomUUID(), role: "RAAZIA" };
  next();
}

function addProduct(repository, overrides = {}) {
  const product = {
    id: randomUUID(),
    ...PRODUCT,
    isArchived: false,
    ...overrides,
  };
  repository.products.push(product);
  return product;
}

describe("Customer Wishlist API", () => {
  let dataRepository;
  let product;
  let customerAApp;
  let customerBApp;

  beforeEach(() => {
    dataRepository = createMemoryRepository();
    product = addProduct(dataRepository);
    customerAApp = createApp({
      dataRepository,
      authenticate: customerSession(CUSTOMER_A),
    });
    customerBApp = createApp({
      dataRepository,
      authenticate: customerSession(CUSTOMER_B),
    });
  });

  it("adds a listed product, and repeated requests return the existing item", async () => {
    const first = await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(201);
    const repeated = await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(200);

    expect(first.body.item.product).toMatchObject({
      id: product.id,
      name: PRODUCT.name,
      basePrice: PRODUCT.basePrice,
    });
    expect(first.body.alreadySaved).toBe(false);
    expect(repeated.body.alreadySaved).toBe(true);
    expect(dataRepository.wishlistItems).toHaveLength(1);
  });

  it("returns only the authenticated customer's saved products", async () => {
    const otherProduct = addProduct(dataRepository, { name: "Crochet tulip" });
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(201);
    await request(customerBApp)
      .post("/api/customer/wishlist")
      .send({ productId: otherProduct.id })
      .expect(201);

    const customerAItems = await request(customerAApp)
      .get("/api/customer/wishlist")
      .expect(200);
    const customerBItems = await request(customerBApp)
      .get("/api/customer/wishlist")
      .expect(200);

    expect(customerAItems.body.items.map((item) => item.product.id)).toEqual([product.id]);
    expect(customerBItems.body.items.map((item) => item.product.id)).toEqual([otherProduct.id]);
    expect(customerAItems.body.items[0]).not.toHaveProperty("customerId");
  });

  it("removes only the authenticated customer's entry and reports missing entries", async () => {
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(201);

    await request(customerBApp)
      .delete(`/api/customer/wishlist/${product.id}`)
      .expect(404);
    expect((await request(customerAApp).get("/api/customer/wishlist")).body.items)
      .toHaveLength(1);

    await request(customerAApp)
      .delete(`/api/customer/wishlist/${product.id}`)
      .expect(200, { removed: true });
    await request(customerAApp)
      .delete(`/api/customer/wishlist/${product.id}`)
      .expect(404);
  });

  it("retains saved products across requests and app instances", async () => {
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(201);

    const restartedApp = createApp({
      dataRepository,
      authenticate: customerSession(CUSTOMER_A),
    });
    const response = await request(restartedApp)
      .get("/api/customer/wishlist")
      .expect(200);

    expect(response.body.items.map((item) => item.product.id)).toEqual([product.id]);
  });

  it("rejects malformed, unknown, and archived products", async () => {
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: "not-a-uuid" })
      .expect(400);

    await request(customerAApp)
      .delete("/api/customer/wishlist/not-a-uuid")
      .expect(400);

    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: randomUUID() })
      .expect(404);

    const archived = addProduct(dataRepository, {
      name: "Archived flower",
      isArchived: true,
    });
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: archived.id })
      .expect(404);
  });

  it("does not accept a client-supplied owner ID", async () => {
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id, customerId: CUSTOMER_B })
      .expect(400);

    expect(dataRepository.wishlistItems).toHaveLength(0);
  });

  it("allows removing an item after its product is archived", async () => {
    await request(customerAApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(201);
    product.isArchived = true;

    const response = await request(customerAApp)
      .get("/api/customer/wishlist")
      .expect(200);
    expect(response.body.items[0].product.id).toBe(product.id);

    await request(customerAApp)
      .delete(`/api/customer/wishlist/${product.id}`)
      .expect(200, { removed: true });
  });

  it("requires authentication and the Customer role for every operation", async () => {
    const anonymousApp = createApp({ dataRepository });
    await request(anonymousApp)
      .get("/api/customer/wishlist")
      .set("x-user-id", CUSTOMER_A)
      .set("x-user-role", "CUSTOMER")
      .expect(401);
    await request(anonymousApp)
      .post("/api/customer/wishlist")
      .send({ productId: product.id })
      .expect(401);
    await request(anonymousApp)
      .delete(`/api/customer/wishlist/${product.id}`)
      .expect(401);

    const raaziaApp = createApp({
      dataRepository,
      authenticate: raaziaSession,
    });
    await request(raaziaApp)
      .get("/api/customer/wishlist")
      .expect(403);
  });
});

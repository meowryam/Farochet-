import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import repository from "../src/data-access/repositories/index.js";
import { createProductManagement } from "../src/business-logic/product/index.js";
import pricingAndDiscountManagement from "../src/business-logic/pricing/index.js";

const seedFile = resolve(fileURLToPath(new URL(".", import.meta.url)), "seed-products.json");
const products = JSON.parse(await readFile(seedFile, "utf8"));
const orderSeedFile = resolve(fileURLToPath(new URL(".", import.meta.url)), "seed-orders.json");
const orderFixtures = JSON.parse(await readFile(orderSeedFile, "utf8"));

if (process.env.NODE_ENV !== "development") {
  throw new Error("Product seed data can only be applied when NODE_ENV=development.");
}

if (!Array.isArray(products)) {
  throw new TypeError("prisma/seed-products.json must contain a JSON array.");
}
if (!Array.isArray(orderFixtures)) {
  throw new TypeError("prisma/seed-orders.json must contain a JSON array.");
}

const productManagement = createProductManagement({ repository, pricingAndDiscountManagement });
try {
  const savedProducts = await repository.listProducts({ includeArchived: true });
  const productsByName = new Map(savedProducts.map((product) => [product.name, product]));
  const missingProducts = products.filter((product) => !productsByName.has(product.name));

  if (savedProducts.length === 0 && missingProducts.length > 0) {
    const seededProducts = await productManagement.seedProducts(missingProducts);
    for (const product of seededProducts) productsByName.set(product.name, product);
    console.info(`Seeded ${seededProducts.length} product record(s).`);
  } else {
    for (const product of missingProducts) {
      const savedProduct = await productManagement.createProduct(product);
      productsByName.set(savedProduct.name, savedProduct);
    }
    if (missingProducts.length > 0) {
      console.info(`Added ${missingProducts.length} missing product seed record(s).`);
    }
  }

  for (const fixture of orderFixtures) {
    const product = productsByName.get(fixture.productName);
    if (!product) {
      throw new Error(`Order fixture references an unknown seeded product: ${fixture.productName}`);
    }
    await repository.upsertInquiry(fixture.inquiryId, {
      customerId: fixture.customerId,
      productId: product.id,
      message: fixture.message,
    });
    await repository.upsertOrder(fixture.orderId, {
      inquiryId: fixture.inquiryId,
      approvedPrice: fixture.approvedPrice,
      negotiatedPriceSnapshot: fixture.negotiatedPriceSnapshot,
      manufacturingStatus: fixture.manufacturingStatus,
      paymentStatus: fixture.paymentStatus,
      deliveryStatus: fixture.deliveryStatus,
    });
  }

  console.info(`Upserted ${orderFixtures.length} confirmed order fixture(s).`);
} finally {
  await repository.getPrismaClient().$disconnect();
}

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import repository from "../src/data-access/repositories/index.js";
import { createProductManagement } from "../src/business-logic/product/index.js";
import pricingAndDiscountManagement from "../src/business-logic/pricing/index.js";

const seedFile = resolve(fileURLToPath(new URL(".", import.meta.url)), "seed-products.json");
const products = JSON.parse(await readFile(seedFile, "utf8"));

if (process.env.NODE_ENV !== "development") {
  throw new Error("Product seed data can only be applied when NODE_ENV=development.");
}

if (!Array.isArray(products)) {
  throw new TypeError("prisma/seed-products.json must contain a JSON array.");
}

if (products.length === 0) {
  console.info("No approved product seed records configured; nothing to seed.");
} else {
  const productManagement = createProductManagement({ repository, pricingAndDiscountManagement });
  try {
    const seededProducts = await productManagement.seedProducts(products);
    console.info(`Seeded ${seededProducts.length} product record(s).`);
  } finally {
    await repository.getPrismaClient().$disconnect();
  }
}

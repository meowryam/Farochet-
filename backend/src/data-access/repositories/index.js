import { PrismaClient } from "../../generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

let prismaClient;

function getPrismaClient() {
  if (!prismaClient) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL is not configured. Set it in backend/.env before using the repository.",
      );
    }

    const adapter = new PrismaPg({ connectionString });
    prismaClient = new PrismaClient({ adapter });
  }

  return prismaClient;
}

async function listProducts({ includeArchived = false } = {}) {
  return getPrismaClient().product.findMany({
    where: includeArchived ? {} : { isArchived: false },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

async function findProductById(id) {
  return getPrismaClient().product.findUnique({ where: { id } });
}

async function createProduct(data) {
  return getPrismaClient().product.create({ data });
}

async function updateProduct(id, data) {
  return getPrismaClient().product.update({ where: { id }, data });
}

async function archiveProduct(id) {
  return getPrismaClient().product.update({
    where: { id },
    data: { isArchived: true },
  });
}

async function seedProducts(products) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (transaction) => {
    const existingProducts = await transaction.product.count();
    if (existingProducts > 0) {
      const error = new Error("Product seeds can only be applied to an empty Product table.");
      error.status = 409;
      error.code = "PRODUCT_SEED_REQUIRES_EMPTY_TABLE";
      throw error;
    }

    return Promise.all(
      products.map((data) => transaction.product.create({ data })),
    );
  });
}

const repository = {
  getPrismaClient,
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  seedProducts,
};

export default repository;
export { getPrismaClient };

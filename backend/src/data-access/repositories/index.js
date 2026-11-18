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

const repository = {
  getPrismaClient,
};

export default repository;
export { getPrismaClient };

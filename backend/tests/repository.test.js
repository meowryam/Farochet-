import { afterAll, describe, expect, it, vi } from "vitest";

describe("centralized Prisma repository", () => {
  it("fails clearly when DATABASE_URL is not configured", async () => {
    vi.resetModules();
    delete process.env.DATABASE_URL;

    const { getPrismaClient } = await import("../src/data-access/repositories/index.js");

    expect(() => getPrismaClient()).toThrow(/DATABASE_URL is not configured/);
  });

  it("initializes one shared Prisma client with the PostgreSQL adapter", async () => {
    vi.resetModules();
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/postgres";

    const repositoryModule = await import("../src/data-access/repositories/index.js");
    const client = repositoryModule.getPrismaClient();

    expect(client).toBe(repositoryModule.getPrismaClient());
    expect(client).toBe(repositoryModule.default.getPrismaClient());
    expect(typeof client.$connect).toBe("function");
    expect(typeof client.$disconnect).toBe("function");
  });
});

afterAll(async () => {
  const repositoryModule = await import("../src/data-access/repositories/index.js");
  await repositoryModule.getPrismaClient().$disconnect();
});

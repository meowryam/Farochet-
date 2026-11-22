import { beforeEach, describe, expect, it, vi } from "vitest";

const { wishlistItemClient, databaseClient } = vi.hoisted(() => {
  const wishlistItem = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  };

  return {
    wishlistItemClient: wishlistItem,
    databaseClient: { wishlistItem },
  };
});

vi.mock("../src/generated/prisma/client.ts", () => ({
  PrismaClient: class {
    constructor() {
      return databaseClient;
    }
  },
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {},
}));

import repository from "../src/data-access/repositories/index.ts";

const customerId = "10c6018d-4c7f-4f15-9b21-e523ba975b0e";
const productId = "2ba633d2-b19a-43d8-bfc9-22dd8300e3c1";
const existingItem = {
  id: "c733e3d3-2647-46be-980d-2a91e67b16f0",
  customerId,
  productId,
  createdAt: new Date("2026-11-22T10:00:00.000Z"),
};

beforeEach(() => {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  databaseClient.wishlistItem = wishlistItemClient;
  wishlistItemClient.create.mockReset();
  wishlistItemClient.findUnique.mockReset();
  wishlistItemClient.findMany.mockReset();
  wishlistItemClient.deleteMany.mockReset();
});

describe("Wishlist Repository operations", () => {
  it("creates a wishlist row using the authenticated customer and product IDs", async () => {
    wishlistItemClient.create.mockResolvedValue(existingItem);

    await expect(repository.addWishlistItem({ customerId, productId }))
      .resolves.toEqual({ item: existingItem, created: true });

    expect(wishlistItemClient.create).toHaveBeenCalledWith({
      data: { customerId, productId },
      select: {
        id: true,
        customerId: true,
        productId: true,
        createdAt: true,
      },
    });
  });

  it("treats a concurrent duplicate as an idempotent add", async () => {
    wishlistItemClient.create.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );
    wishlistItemClient.findUnique.mockResolvedValue(existingItem);

    await expect(repository.addWishlistItem({ customerId, productId }))
      .resolves.toEqual({ item: existingItem, created: false });

    expect(wishlistItemClient.findUnique).toHaveBeenCalledWith({
      where: { customerId_productId: { customerId, productId } },
      select: {
        id: true,
        customerId: true,
        productId: true,
        createdAt: true,
      },
    });
  });

  it("scopes list and remove queries to the supplied customer", async () => {
    wishlistItemClient.findMany.mockResolvedValue([existingItem]);
    wishlistItemClient.deleteMany.mockResolvedValue({ count: 1 });

    await expect(repository.listWishlistItems(customerId)).resolves.toEqual([existingItem]);
    expect(wishlistItemClient.findMany).toHaveBeenCalledWith({
      where: { customerId },
      select: { id: true, productId: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });

    await expect(repository.removeWishlistItem({ customerId, productId })).resolves.toBe(true);
    expect(wishlistItemClient.deleteMany).toHaveBeenCalledWith({
      where: { customerId, productId },
    });
  });

  it("reports clearly when the generated client has no WishlistItem model", async () => {
    databaseClient.wishlistItem = undefined;

    await expect(repository.listWishlistItems(customerId)).rejects.toMatchObject({
      status: 503,
      code: "WISHLIST_SCHEMA_NOT_AVAILABLE",
      message: expect.stringContaining("Wishlist database migration"),
    });
  });

  it.each(["list", "add", "remove"])(
    "returns an actionable 503 when the %s operation finds no WishlistItem table",
    async (operation) => {
      const missingTableError = () => Object.assign(new Error("Table does not exist"), {
        code: "P2021",
        meta: {
          modelName: "WishlistItem",
          driverAdapterError: { cause: { table: "public.WishlistItem" } },
        },
      });

      if (operation === "list") {
        wishlistItemClient.findMany.mockRejectedValueOnce(missingTableError());
      } else if (operation === "add") {
        wishlistItemClient.create.mockRejectedValueOnce(missingTableError());
      } else {
        wishlistItemClient.deleteMany.mockRejectedValueOnce(missingTableError());
      }

      const result = operation === "list"
        ? repository.listWishlistItems(customerId)
        : operation === "add"
          ? repository.addWishlistItem({ customerId, productId })
          : repository.removeWishlistItem({ customerId, productId });

      await expect(result).rejects.toMatchObject({
        status: 503,
        code: "WISHLIST_SCHEMA_NOT_AVAILABLE",
        message: expect.stringContaining("Wishlist database migration"),
      });
    },
  );
});

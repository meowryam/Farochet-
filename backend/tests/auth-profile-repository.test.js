import { beforeEach, describe, expect, it, vi } from "vitest";

const userId = "22f3d9b2-6f10-4f3f-933a-0b9042d90cf8";
const email = "customer@example.test";

const { userClient, intentClient, databaseClient } = vi.hoisted(() => {
  const user = {
    findUnique: vi.fn(),
    create: vi.fn(),
  };
  const intent = {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  };
  const transactionClient = { user, customerRegistrationIntent: intent };

  return {
    userClient: user,
    intentClient: intent,
    databaseClient: {
      ...transactionClient,
      $transaction: vi.fn(async (callback) => callback(transactionClient)),
    },
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

function activeIntent(overrides = {}) {
  return {
    id: "9146ad14-5b08-4dd6-9791-05a87b5b69d6",
    supabaseUserId: userId,
    email,
    displayName: "Customer",
    status: "ACTIVE",
    createdAt: new Date("2026-11-21T10:00:00.000Z"),
    activatedAt: new Date("2026-11-21T10:10:00.000Z"),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    consumedAt: null,
    ...overrides,
  };
}

describe("customer registration intent repository operations", () => {
  beforeEach(() => {
    userClient.findUnique.mockReset();
    userClient.create.mockReset();
    intentClient.create.mockReset();
    intentClient.findFirst.mockReset();
    intentClient.findUnique.mockReset();
    intentClient.updateMany.mockReset();
    databaseClient.$transaction.mockReset();
    databaseClient.$transaction.mockImplementation(async (callback) => callback({
      user: userClient,
      customerRegistrationIntent: intentClient,
    }));
    process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
  });

  it("creates a PENDING intent bound to provider identity and validated display name", async () => {
    vi.resetModules();
    intentClient.create.mockImplementation(async ({ data }) => ({ id: "intent-id", ...data }));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await repository.createCustomerRegistrationIntent({
      supabaseUserId: userId,
      email,
      displayName: "Customer",
    });

    expect(intentClient.create).toHaveBeenCalledWith({
      data: {
        supabaseUserId: userId,
        email,
        displayName: "Customer",
        status: "PENDING",
      },
      select: { id: true, supabaseUserId: true, email: true, status: true },
    });
  });

  it("activates once for 30 minutes after verified email confirmation", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent({ status: "PENDING", activatedAt: null, expiresAt: null }));
    intentClient.updateMany.mockResolvedValue({ count: 1 });
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    const result = await repository.activateCustomerRegistrationIntent({
      supabaseUserId: userId,
      email,
      emailConfirmedAt: "2026-11-21T10:09:00.000Z",
    });
    const update = intentClient.updateMany.mock.calls[0][0];

    expect(result.expiresAt.getTime() - update.data.activatedAt.getTime()).toBe(30 * 60 * 1000);
    expect(update).toMatchObject({
      where: { id: "9146ad14-5b08-4dd6-9791-05a87b5b69d6", status: "PENDING" },
      data: { status: "ACTIVE" },
    });
    expect(databaseClient.$transaction).toHaveBeenCalledTimes(1);
  });

  it("does not extend an already active intent on retry", async () => {
    vi.resetModules();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    intentClient.findUnique.mockResolvedValue(activeIntent({ expiresAt: expiry }));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    const result = await repository.activateCustomerRegistrationIntent({
      supabaseUserId: userId,
      email,
      emailConfirmedAt: "2026-11-21T10:09:00.000Z",
    });

    expect(result.expiresAt).toEqual(expiry);
    expect(intentClient.updateMany).not.toHaveBeenCalled();
  });

  it("rejects unconfirmed and mismatched identities during activation", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent({ status: "PENDING" }));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await expect(repository.activateCustomerRegistrationIntent({
      supabaseUserId: userId,
      email,
      emailConfirmedAt: null,
    })).rejects.toMatchObject({ status: 403, code: "CUSTOMER_REGISTRATION_EMAIL_UNCONFIRMED" });

    await expect(repository.activateCustomerRegistrationIntent({
      supabaseUserId: userId,
      email: "changed@example.test",
      emailConfirmedAt: "2026-11-21T10:09:00.000Z",
    })).rejects.toMatchObject({ status: 409, code: "USER_PROFILE_EMAIL_MISMATCH" });
    expect(intentClient.updateMany).not.toHaveBeenCalled();
  });

  it("creates a CUSTOMER profile and consumes its active intent in one transaction", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent());
    intentClient.updateMany.mockResolvedValue({ count: 1 });
    userClient.findUnique.mockResolvedValue(null);
    userClient.create.mockResolvedValue({
      id: userId,
      email,
      displayName: "Customer",
      role: "CUSTOMER",
    });
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    const result = await repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email,
    });

    expect(databaseClient.$transaction).toHaveBeenCalledTimes(1);
    expect(intentClient.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: "9146ad14-5b08-4dd6-9791-05a87b5b69d6",
        status: "ACTIVE",
        expiresAt: { gt: expect.any(Date) },
      },
      data: { status: "CONSUMED", consumedAt: expect.any(Date) },
    }));
    expect(userClient.create).toHaveBeenCalledWith({
      data: { id: userId, email, displayName: "Customer", role: "CUSTOMER" },
      select: { id: true, email: true, displayName: true, role: true },
    });
    expect(result).toEqual({
      user: { id: userId, email, displayName: "Customer", role: "CUSTOMER" },
      created: true,
    });
  });

  it("rejects an expired intent without creating a profile", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent({ expiresAt: new Date(Date.now() - 1000) }));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await expect(repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email,
    })).rejects.toMatchObject({
      status: 410,
      code: "CUSTOMER_REGISTRATION_INTENT_EXPIRED",
    });
    expect(intentClient.updateMany).not.toHaveBeenCalled();
    expect(userClient.create).not.toHaveBeenCalled();
  });

  it("rejects a consumed intent on replay", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent({
      status: "CONSUMED",
      consumedAt: new Date(),
    }));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await expect(repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email,
    })).rejects.toMatchObject({
      status: 409,
      code: "CUSTOMER_REGISTRATION_INTENT_CONSUMED",
    });
    expect(userClient.create).not.toHaveBeenCalled();
  });

  it("preserves an existing RAAZIA profile without overwriting its fields or role", async () => {
    vi.resetModules();
    const existing = {
      id: userId,
      email,
      displayName: "Raazia",
      role: "RAAZIA",
    };
    intentClient.findUnique.mockResolvedValue(activeIntent());
    intentClient.updateMany.mockResolvedValue({ count: 1 });
    userClient.findUnique.mockResolvedValue(existing);
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    const result = await repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email,
    });

    expect(result).toEqual({ user: existing, created: false });
    expect(userClient.create).not.toHaveBeenCalled();
    expect(existing).toEqual({
      id: userId,
      email,
      displayName: "Raazia",
      role: "RAAZIA",
    });
  });

  it("rejects a mismatched verified email without creating a profile", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent());
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await expect(repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email: "changed@example.test",
    })).rejects.toMatchObject({ status: 409, code: "USER_PROFILE_EMAIL_MISMATCH" });
    expect(intentClient.updateMany).not.toHaveBeenCalled();
    expect(userClient.create).not.toHaveBeenCalled();
  });

  it("allows only one concurrent completion to consume an intent", async () => {
    vi.resetModules();
    let status = "ACTIVE";
    intentClient.findUnique.mockImplementation(async () => activeIntent({ status }));
    intentClient.updateMany.mockImplementation(async () => {
      if (status !== "ACTIVE") return { count: 0 };
      status = "CONSUMED";
      return { count: 1 };
    });
    userClient.findUnique.mockResolvedValue(null);
    userClient.create.mockResolvedValue({
      id: userId,
      email,
      displayName: "Customer",
      role: "CUSTOMER",
    });
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    const results = await Promise.allSettled([
      repository.createCustomerProfileFromRegistrationIntent({ supabaseUserId: userId, email }),
      repository.createCustomerProfileFromRegistrationIntent({ supabaseUserId: userId, email }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(userClient.create).toHaveBeenCalledTimes(1);
  });

  it("rolls the profile operation through the transaction and rejects profile-write failures", async () => {
    vi.resetModules();
    intentClient.findUnique.mockResolvedValue(activeIntent());
    intentClient.updateMany.mockResolvedValue({ count: 1 });
    userClient.findUnique.mockResolvedValue(null);
    userClient.create.mockRejectedValue(new Error("simulated write failure"));
    const { default: repository } = await import("../src/data-access/repositories/index.ts");

    await expect(repository.createCustomerProfileFromRegistrationIntent({
      supabaseUserId: userId,
      email,
    })).rejects.toThrow("simulated write failure");
    expect(databaseClient.$transaction).toHaveBeenCalledTimes(1);
  });
});

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

async function getPublicDiscount() {
  return getPrismaClient().publicDiscount.findUnique({
    where: { id: "current" },
  });
}

async function upsertPublicDiscount(data) {
  return getPrismaClient().publicDiscount.upsert({
    where: { id: "current" },
    create: { id: "current", ...data },
    update: data,
  });
}

async function listInquiries() {
  return getPrismaClient().inquiry.findMany({
    include: { product: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

async function findInquiryById(id) {
  return getPrismaClient().inquiry.findUnique({
    where: { id },
    include: { product: { select: { name: true } } },
  });
}

async function upsertInquiry(id, data) {
  return getPrismaClient().inquiry.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
}

async function createCustomizationRequest({ inquiry, customization }) {
  const prisma = getPrismaClient();

  // The generated Prisma Client is refreshed by the coordinator after the
  // Cycle 2 schema migration is applied. Fail clearly until then.
  if (!prisma.customization || !prisma.pendingOrderRequest) {
    const error = new Error(
      "Customization records are not available in the generated Prisma Client.",
    );
    error.status = 503;
    error.code = "CUSTOMIZATION_SCHEMA_NOT_AVAILABLE";
    throw error;
  }

  return prisma.$transaction(async (transaction) => {
    const createdInquiry = await transaction.inquiry.create({ data: inquiry });
    const createdCustomization = await transaction.customization.create({
      data: { ...customization, inquiryId: createdInquiry.id },
    });
    const pendingOrderRequest = await transaction.pendingOrderRequest.create({
      data: {
        customizationId: createdCustomization.id,
        status: "PENDING",
      },
    });

    return {
      inquiry: createdInquiry,
      customization: createdCustomization,
      pendingOrderRequest,
    };
  });
}

async function listOrders() {
  return getPrismaClient().order.findMany({
    include: {
      inquiry: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ confirmedAt: "desc" }, { id: "asc" }],
  });
}

async function upsertOrder(id, data) {
  return getPrismaClient().order.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
}

async function findOrderById(id) {
  return getPrismaClient().order.findUnique({
    where: { id },
    include: {
      inquiry: {
        include: {
          product: { select: { id: true, name: true } },
        },
      },
    },
  });
}

async function updateOrderManufacturing(id, data) {
  return getPrismaClient().order.update({
    where: { id },
    data,
  });
}

async function findUserById(id) {
  const prisma = getPrismaClient();
  if (!prisma.user) {
    const error = new Error("The shared User profile model is not available in the generated Prisma Client.");
    error.status = 503;
    error.code = "USER_PROFILE_SCHEMA_NOT_AVAILABLE";
    throw error;
  }

  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, displayName: true, role: true },
  });
}

function registrationIntentError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function assertRegistrationIntentModel(prisma) {
  if (!prisma.customerRegistrationIntent) {
    throw registrationIntentError(
      503,
      "CUSTOMER_REGISTRATION_SCHEMA_NOT_AVAILABLE",
      "Customer registration setup is not available.",
    );
  }
}

async function createCustomerRegistrationIntent({ supabaseUserId, email, displayName }) {
  const prisma = getPrismaClient();
  assertRegistrationIntentModel(prisma);

  return prisma.customerRegistrationIntent.create({
    data: {
      supabaseUserId,
      email,
      displayName,
      status: "PENDING",
    },
    select: {
      id: true,
      supabaseUserId: true,
      email: true,
      status: true,
    },
  });
}

async function findPendingCustomerRegistrationByEmail(email) {
  const prisma = getPrismaClient();
  assertRegistrationIntentModel(prisma);

  return prisma.customerRegistrationIntent.findFirst({
    where: { email, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      supabaseUserId: true,
      email: true,
      status: true,
    },
  });
}

async function activateCustomerRegistrationIntent({
  supabaseUserId,
  email,
  emailConfirmedAt,
}) {
  const prisma = getPrismaClient();
  assertRegistrationIntentModel(prisma);

  if (!emailConfirmedAt) {
    throw registrationIntentError(
      403,
      "CUSTOMER_REGISTRATION_EMAIL_UNCONFIRMED",
      "Confirm your email before finishing Customer registration.",
    );
  }

  return prisma.$transaction(async (transaction) => {
    let intent = await transaction.customerRegistrationIntent.findUnique({
      where: { supabaseUserId },
    });

    if (!intent) {
      throw registrationIntentError(
        404,
        "CUSTOMER_REGISTRATION_INTENT_NOT_FOUND",
        "No pending Customer registration was found for this account.",
      );
    }

    if (intent.email !== email) {
      throw registrationIntentError(
        409,
        "USER_PROFILE_EMAIL_MISMATCH",
        "The verified email does not match the registration details.",
      );
    }

    const now = new Date();
    if (intent.status === "CONSUMED") {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_CONSUMED",
        "This Customer registration has already been completed.",
      );
    }

    if (intent.status === "ACTIVE") {
      if (!intent.expiresAt || intent.expiresAt <= now) {
        throw registrationIntentError(
          410,
          "CUSTOMER_REGISTRATION_INTENT_EXPIRED",
          "Customer registration setup expired. Contact Raazia for assistance.",
        );
      }
      return { expiresAt: intent.expiresAt };
    }

    if (intent.status !== "PENDING") {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_INVALID",
        "Customer registration setup is unavailable.",
      );
    }

    const activatedAt = now;
    const expiresAt = new Date(activatedAt.getTime() + 30 * 60 * 1000);
    const activated = await transaction.customerRegistrationIntent.updateMany({
      where: {
        id: intent.id,
        status: "PENDING",
      },
      data: {
        status: "ACTIVE",
        activatedAt,
        expiresAt,
      },
    });

    if (activated.count === 1) return { expiresAt };

    intent = await transaction.customerRegistrationIntent.findUnique({
      where: { supabaseUserId },
    });
    if (intent?.email !== email) {
      throw registrationIntentError(
        409,
        "USER_PROFILE_EMAIL_MISMATCH",
        "The verified email does not match the registration details.",
      );
    }
    if (intent?.status === "ACTIVE" && intent.expiresAt && intent.expiresAt > now) {
      return { expiresAt: intent.expiresAt };
    }
    if (intent?.status === "CONSUMED") {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_CONSUMED",
        "This Customer registration has already been completed.",
      );
    }
    throw registrationIntentError(
      410,
      "CUSTOMER_REGISTRATION_INTENT_EXPIRED",
      "Customer registration setup expired. Contact Raazia for assistance.",
    );
  });
}

async function createCustomerProfileFromRegistrationIntent({ supabaseUserId, email }) {
  const prisma = getPrismaClient();
  assertRegistrationIntentModel(prisma);

  return prisma.$transaction(async (transaction) => {
    const intent = await transaction.customerRegistrationIntent.findUnique({
      where: { supabaseUserId },
    });

    if (!intent) {
      throw registrationIntentError(
        404,
        "CUSTOMER_REGISTRATION_INTENT_NOT_FOUND",
        "No pending Customer registration was found for this account.",
      );
    }
    if (intent.email !== email) {
      throw registrationIntentError(
        409,
        "USER_PROFILE_EMAIL_MISMATCH",
        "The verified email does not match the registration details.",
      );
    }
    if (intent.status === "CONSUMED") {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_CONSUMED",
        "This Customer registration has already been completed.",
      );
    }
    if (intent.status !== "ACTIVE" || !intent.expiresAt) {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_NOT_ACTIVE",
        "Confirm your email and start Customer registration before continuing.",
      );
    }

    const now = new Date();
    if (intent.expiresAt <= now) {
      throw registrationIntentError(
        410,
        "CUSTOMER_REGISTRATION_INTENT_EXPIRED",
        "Customer registration setup expired. Contact Raazia for assistance.",
      );
    }

    const consumed = await transaction.customerRegistrationIntent.updateMany({
      where: {
        id: intent.id,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      data: {
        status: "CONSUMED",
        consumedAt: now,
      },
    });
    if (consumed.count !== 1) {
      throw registrationIntentError(
        409,
        "CUSTOMER_REGISTRATION_INTENT_CONSUMED",
        "This Customer registration has already been completed.",
      );
    }

    const existing = await transaction.user.findUnique({
      where: { id: supabaseUserId },
      select: { id: true, email: true, displayName: true, role: true },
    });
    if (existing) {
      if (existing.email !== email) {
        throw registrationIntentError(
          409,
          "USER_PROFILE_EMAIL_MISMATCH",
          "The verified email does not match the existing user profile.",
        );
      }
      return { user: existing, created: false };
    }

    try {
      const user = await transaction.user.create({
        data: {
          id: supabaseUserId,
          email,
          displayName: intent.displayName,
          role: "CUSTOMER",
        },
        select: { id: true, email: true, displayName: true, role: true },
      });
      return { user, created: true };
    } catch (error) {
      if (error?.code === "P2002") {
        throw registrationIntentError(
          409,
          "USER_PROFILE_EMAIL_CONFLICT",
          "A profile with this email is already associated with another account.",
        );
      }
      throw error;
    }
  });
}

async function getAvailability() {
  return getPrismaClient().raaziaAvailability.findUnique({
    where: { id: "current" },
  });
}

async function upsertAvailability(information) {
  return getPrismaClient().raaziaAvailability.upsert({
    where: { id: "current" },
    create: { id: "current", information },
    update: { information },
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
  getPublicDiscount,
  upsertPublicDiscount,
  listInquiries,
  findInquiryById,
  upsertInquiry,
  createCustomizationRequest,
  listOrders,
  upsertOrder,
  findOrderById,
  updateOrderManufacturing,
  findUserById,
  createCustomerRegistrationIntent,
  findPendingCustomerRegistrationByEmail,
  activateCustomerRegistrationIntent,
  createCustomerProfileFromRegistrationIntent,
  getAvailability,
  upsertAvailability,
  seedProducts,
};

export default repository;
export { getPrismaClient };

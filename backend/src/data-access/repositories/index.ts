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
    include: {
      product: { select: { name: true } },
      customer: { select: { displayName: true, email: true } },
    },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

async function findInquiryById(id) {
  return getPrismaClient().inquiry.findUnique({
    where: { id },
    include: { product: { select: { name: true } } },
  });
}

async function findAdminInquiryById(id) {
  return getPrismaClient().inquiry.findUnique({
    where: { id },
    include: {
      product: { select: { name: true } },
      customer: { select: { displayName: true, email: true } },
    },
  });
}

async function createInquiry(data) {
  return getPrismaClient().inquiry.create({
    data,
    include: { product: { select: { name: true } } },
  });
}

async function listInquiriesByCustomer(customerId) {
  return getPrismaClient().inquiry.findMany({
    where: { customerId },
    include: { product: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });
}

async function upsertInquiry(id, data) {
  return getPrismaClient().inquiry.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
}

async function findWishlistItem(customerId, productId) {
  const prisma = getPrismaClient();
  if (!prisma.wishlistItem) throw wishlistSchemaUnavailable();

  try {
    return await prisma.wishlistItem.findUnique({
      where: { customerId_productId: { customerId, productId } },
      select: { id: true },
    });
  } catch (error) {
    throw mapWishlistStorageError(error);
  }
}

async function createCustomizationRequest({ inquiry, customization }) {
  const prisma = getPrismaClient();
  assertCustomizationSchema(prisma);

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

function assertCustomizationSchema(prisma) {
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
}

const customizationRequestInclude = {
  customization: {
    include: {
      inquiry: {
        include: {
          customer: { select: { id: true, displayName: true } },
        },
      },
    },
  },
};

// Normalize the Prisma join into the read model owned by Customization and
// Quotation Management. No business decision is made here.
function mapCustomizationRequest(request) {
  if (!request) return null;

  const customization = request.customization ?? null;
  const inquiry = customization?.inquiry ?? null;

  return {
    id: request.id,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    customization: customization ? {
      id: customization.id,
      inquiryId: customization.inquiryId,
      productType: customization.productType,
      size: customization.size,
      colour: customization.colour,
      materials: customization.materials,
      quantity: customization.quantity,
      budget: customization.budget,
      specialInstructions: customization.specialInstructions,
      requiredCompletionDate: customization.requiredCompletionDate,
      deliveryAddress: customization.deliveryAddress,
      referenceImages: customization.referenceImages,
      createdAt: customization.createdAt,
      updatedAt: customization.updatedAt,
    } : null,
    inquiry: inquiry ? {
      id: inquiry.id,
      message: inquiry.message,
      createdAt: inquiry.createdAt,
      customerId: inquiry.customerId,
      productId: inquiry.productId ?? null,
      customer: inquiry.customer
        ? { id: inquiry.customer.id, displayName: inquiry.customer.displayName }
        : null,
    } : null,
  };
}

async function listPendingCustomizationRequests() {
  const prisma = getPrismaClient();
  assertCustomizationSchema(prisma);

  const requests = await prisma.pendingOrderRequest.findMany({
    where: { status: "PENDING" },
    include: customizationRequestInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
  });

  return requests.map(mapCustomizationRequest);
}

async function findCustomizationRequestById(id) {
  const prisma = getPrismaClient();
  assertCustomizationSchema(prisma);

  const request = await prisma.pendingOrderRequest.findUnique({
    where: { id },
    include: customizationRequestInclude,
  });

  return mapCustomizationRequest(request);
}

async function findCustomizationByReferenceImage(imagePath) {
  const prisma = getPrismaClient();
  assertCustomizationSchema(prisma);

  const customization = await prisma.customization.findFirst({
    where: { referenceImages: { has: imagePath } },
    include: { inquiry: { select: { customerId: true } } },
  });

  return customization
    ? { id: customization.id, inquiry: customization.inquiry }
    : null;
}

function assertNegotiationSchema(prisma) {
  // The generated Prisma Client is refreshed by the coordinator after the
  // negotiation migration is applied. Fail clearly until then.
  if (!prisma.negotiationEntry) {
    const error = new Error(
      "Negotiation history is not available in the generated Prisma Client.",
    );
    error.status = 503;
    error.code = "NEGOTIATION_SCHEMA_NOT_AVAILABLE";
    throw error;
  }
}

function mapNegotiationEntry(entry) {
  if (!entry) return null;

  return {
    id: entry.id,
    customizationId: entry.customizationId,
    proposer: entry.proposer,
    proposedPrice: entry.proposedPrice,
    note: entry.note,
    createdAt: entry.createdAt,
  };
}

async function createNegotiationEntry({ customizationId, proposer, proposedPrice, note }) {
  const prisma = getPrismaClient();
  assertNegotiationSchema(prisma);

  const entry = await prisma.negotiationEntry.create({
    data: {
      customizationId,
      proposer,
      proposedPrice,
      note: note ?? null,
    },
  });

  return mapNegotiationEntry(entry);
}

async function listNegotiationEntries(customizationId) {
  const prisma = getPrismaClient();
  assertNegotiationSchema(prisma);

  const entries = await prisma.negotiationEntry.findMany({
    where: { customizationId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  return entries.map(mapNegotiationEntry);
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

async function updateOrderPaymentStatus(id, paymentStatus) {
  return getPrismaClient().order.update({
    where: { id },
    data: { paymentStatus },
  });
}

async function updateOrderDelivery(id, data, priceRevision = null) {
  const prisma = getPrismaClient();
  if (!priceRevision) {
    return prisma.order.update({
      where: { id },
      data,
    });
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data,
    });
    await tx.orderPriceRevision.create({
      data: {
        orderId: id,
        originalPrice: priceRevision.originalPrice,
        revisedPrice: priceRevision.revisedPrice,
        actingUserId: priceRevision.actingUserId,
        customerAgreed: priceRevision.customerAgreed,
        reason: priceRevision.reason,
      },
    });
    return updated;
  });
}

function wishlistSchemaUnavailable(cause) {
  const error = new Error(
    "Wishlist storage is not initialized. Please contact the administrator to apply the Wishlist database migration.",
  );
  error.status = 503;
  error.code = "WISHLIST_SCHEMA_NOT_AVAILABLE";
  if (cause) error.cause = cause;
  return error;
}

function mapWishlistStorageError(error) {
  const missingWishlistTable = error?.code === "P2021"
    && (
      error?.meta?.modelName === "WishlistItem"
      || error?.meta?.driverAdapterError?.cause?.table === "public.WishlistItem"
    );

  return missingWishlistTable ? wishlistSchemaUnavailable(error) : error;
}

async function addWishlistItem({ customerId, productId }) {
  const prisma = getPrismaClient();
  if (!prisma.wishlistItem) throw wishlistSchemaUnavailable();

  const select = {
    id: true,
    customerId: true,
    productId: true,
    createdAt: true,
  };

  try {
    const item = await prisma.wishlistItem.create({
      data: { customerId, productId },
      select,
    });
    return { item, created: true };
  } catch (error) {
    if (error?.code !== "P2002") throw mapWishlistStorageError(error);

    let item;
    try {
      item = await prisma.wishlistItem.findUnique({
        where: { customerId_productId: { customerId, productId } },
        select,
      });
    } catch (lookupError) {
      throw mapWishlistStorageError(lookupError);
    }
    if (!item) throw error;
    return { item, created: false };
  }
}

async function listWishlistItems(customerId) {
  const prisma = getPrismaClient();
  if (!prisma.wishlistItem) throw wishlistSchemaUnavailable();

  try {
    return await prisma.wishlistItem.findMany({
      where: { customerId },
      select: {
        id: true,
        productId: true,
        createdAt: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  } catch (error) {
    throw mapWishlistStorageError(error);
  }
}

async function removeWishlistItem({ customerId, productId }) {
  const prisma = getPrismaClient();
  if (!prisma.wishlistItem) throw wishlistSchemaUnavailable();

  try {
    const result = await prisma.wishlistItem.deleteMany({
      where: { customerId, productId },
    });
    return result.count > 0;
  } catch (error) {
    throw mapWishlistStorageError(error);
  }
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

/**
 * List Orders whose confirmedAt falls within the given UTC date range, inclusive.
 * Returns only the fields required by Sales Summary (FR-18).
 * No authorization decision is made here — the caller (Order Management) is responsible.
 */
async function listOrdersForDateRange({ confirmedAtStart, confirmedAtEnd }) {
  return getPrismaClient().order.findMany({
    where: {
      confirmedAt: {
        gte: confirmedAtStart,
        lte: confirmedAtEnd,
      },
    },
    select: {
      id: true,
      approvedPrice: true,
      manufacturingStatus: true,
      confirmedAt: true,
    },
    orderBy: [{ confirmedAt: "asc" }, { id: "asc" }],
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
  findAdminInquiryById,
  createInquiry,
  listInquiriesByCustomer,
  upsertInquiry,
  findWishlistItem,
  createCustomizationRequest,
  listPendingCustomizationRequests,
  findCustomizationRequestById,
  findCustomizationByReferenceImage,
  createNegotiationEntry,
  listNegotiationEntries,
  listOrders,
  listOrdersForDateRange,
  upsertOrder,
  findOrderById,
  updateOrderManufacturing,
  updateOrderPaymentStatus,
  updateOrderDelivery,
  addWishlistItem,
  listWishlistItems,
  removeWishlistItem,
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

import express from "express";
import cors from "cors";
import repository from "./data-access/repositories/index.ts";
import productManagement, { createProductManagement } from "./business-logic/product/index.js";
import { createInquiryManagement } from "./business-logic/inquiry/index.js";
import { createCustomizationAndQuotationManagement } from "./business-logic/customization/index.js";
import orderManagement, { createOrderManagement } from "./business-logic/order/index.js";
import availabilityManagement, { createAvailabilityManagement } from "./business-logic/availability/index.js";
import statusManagement, { createStatusManagement } from "./business-logic/status/index.js";
import pricingAndDiscountManagement from "./business-logic/pricing/index.js";
import { createPricingAndDiscountManagement } from "./business-logic/pricing/index.js";
import wishlistManagement, { createWishlistManagement } from "./business-logic/wishlist/index.js";
import {
  authenticateRequest,
  createSupabaseIdentityVerification,
} from "./presentation/middleware/authentication.js";
import healthRoutes from "./presentation/routes/health.routes.js";
import { createAuthRoutes } from "./presentation/routes/auth.routes.js";
import { createProductRoutes, createPublicProductRoutes } from "./presentation/routes/product.routes.js";
import { createCustomerInquiryRoutes, createInquiryRoutes } from "./presentation/routes/inquiry.routes.js";
import {
  createCustomizationRoutes,
  createAdminCustomizationRoutes,
} from "./presentation/routes/customization.routes.js";
import { createWishlistRoutes } from "./presentation/routes/wishlist.routes.js";
import { createOrderRoutes } from "./presentation/routes/order.routes.js";
import { createAvailabilityRoutes } from "./presentation/routes/availability.routes.js";
import {
  createAdminPricingRouter,
  createPublicPricingRouter,
} from "./presentation/routes/pricing.routes.js";
import { notFoundHandler } from "./presentation/middleware/notFoundHandler.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";
import { createInMemoryImageStorage } from "./data-access/storage/inMemoryImageStorage.js";

export function createApp({
  dataRepository = repository,
  productManagement: productManagementOverride,
  inquiryManagement: inquiryManagementOverride,
  customizationManagement: customizationManagementOverride,
  orderManagement: orderManagementOverride,
  availabilityManagement: availabilityManagementOverride,
  wishlistManagement: wishlistManagementOverride,
  imageStorage = createInMemoryImageStorage(),
  authenticate = authenticateRequest,
  authenticateCustomer = authenticate,
  verifyIdentity = createSupabaseIdentityVerification(),
} = {}) {
  const app = express();
  const pricing = dataRepository === repository
    ? pricingAndDiscountManagement
    : createPricingAndDiscountManagement({ repository: dataRepository });
  const products = productManagementOverride ?? (
    dataRepository === repository
      ? productManagement
      : createProductManagement({
          repository: dataRepository,
          pricingAndDiscountManagement: pricing,
        })
  );
  const inquiries = inquiryManagementOverride ?? createInquiryManagement({
    repository: dataRepository,
    productManagement: products,
  });
  const customizations = customizationManagementOverride
    ?? createCustomizationAndQuotationManagement({
      repository: dataRepository,
      productManagement: products,
      imageStorage,
    });
  const orders = orderManagementOverride ?? (
    dataRepository === repository
      ? orderManagement
      : createOrderManagement({ repository: dataRepository })
  );
  const availability = availabilityManagementOverride ?? (
    dataRepository === repository
      ? availabilityManagement
      : createAvailabilityManagement({ repository: dataRepository })
  );
  const statuses = dataRepository === repository
    ? statusManagement
    : createStatusManagement({ repository: dataRepository });
  const wishlist = wishlistManagementOverride ?? (
    dataRepository === repository
      ? wishlistManagement
      : createWishlistManagement({ repository: dataRepository, productManagement: products })
  );
  const orderRoutes = createOrderRoutes({
    orderManagement: orders,
    statusManagement: statuses,
    authenticate,
    authenticateCustomer,
  });
  const availabilityRoutes = createAvailabilityRoutes({
    availabilityManagement: availability,
    authenticate,
    authenticateCustomer,
  });

 const allowedOrigins = new Set([
  "http://localhost:5174",
]);
  if (process.env.FRONTEND_URL) {
    allowedOrigins.add(process.env.FRONTEND_URL);
  }

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
  }));
  app.use(express.json());

  app.use("/api", healthRoutes);
  app.use("/api/auth", createAuthRoutes({
    authenticate,
    verifyIdentity,
    userRepository: dataRepository,
  }));
  app.use(
    "/api/admin/products",
    createProductRoutes({ productManagement: products, authenticate }),
  );
  app.use(
    "/api/products",
    createPublicProductRoutes({ productManagement: products }),
  );
  app.use(
    "/api/admin/pricing",
    createAdminPricingRouter({ pricingAndDiscountManagement: pricing, authenticate }),
  );
  app.use(
    "/api/pricing/public",
    createPublicPricingRouter(pricing),
  );
  app.use(
    "/api/admin/inquiries",
    createInquiryRoutes({ inquiryManagement: inquiries, authenticate }),
  );
  app.use(
    "/api/customer/inquiries",
    createCustomerInquiryRoutes({
      inquiryManagement: inquiries,
      authenticate: authenticateCustomer,
    }),
  );
  app.use("/api/admin/orders", orderRoutes.adminRouter);
  app.use("/api/admin/availability", availabilityRoutes.adminRouter);
  app.use("/api/customer/availability", availabilityRoutes.customerRouter);
  app.use("/api/availability", availabilityRoutes.publicRouter);
  app.use(
    "/api/admin/customization",
    createAdminCustomizationRoutes({
      customizationManagement: customizations,
      authenticate,
    }),
  );
  app.use(
    "/api/customer/customization",
    createCustomizationRoutes({
      customizationManagement: customizations,
      authenticate: authenticateCustomer,
    }),
  );
  app.use(
    "/api/customer/wishlist",
    createWishlistRoutes({
      wishlistManagement: wishlist,
      authenticate: authenticateCustomer,
    }),
  );
  app.use("/api/customer/orders", orderRoutes.customerRouter);
  app.use("/api/orders", orderRoutes.customerRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

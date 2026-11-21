import express from "express";
import cors from "cors";
import repository from "./data-access/repositories/index.ts";
import productManagement, { createProductManagement } from "./business-logic/product/index.js";
import inquiryManagement, { createInquiryManagement } from "./business-logic/inquiry/index.js";
import orderManagement, { createOrderManagement } from "./business-logic/order/index.js";
import availabilityManagement, { createAvailabilityManagement } from "./business-logic/availability/index.js";
import statusManagement, { createStatusManagement } from "./business-logic/status/index.js";
import pricingAndDiscountManagement from "./business-logic/pricing/index.js";
import {
  authenticateRequest,
  createSupabaseIdentityVerification,
} from "./presentation/middleware/authentication.js";
import healthRoutes from "./presentation/routes/health.routes.js";
import { createAuthRoutes } from "./presentation/routes/auth.routes.js";
import { createProductRoutes } from "./presentation/routes/product.routes.js";
import { createInquiryRoutes } from "./presentation/routes/inquiry.routes.js";
import { createOrderRoutes } from "./presentation/routes/order.routes.js";
import { createAvailabilityRoutes } from "./presentation/routes/availability.routes.js";
import { notFoundHandler } from "./presentation/middleware/notFoundHandler.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";

export function createApp({
  dataRepository = repository,
  productManagement: productManagementOverride,
  inquiryManagement: inquiryManagementOverride,
  orderManagement: orderManagementOverride,
  availabilityManagement: availabilityManagementOverride,
  authenticate = authenticateRequest,
  authenticateCustomer = authenticate,
  verifyIdentity = createSupabaseIdentityVerification(),
} = {}) {
  const app = express();
  const products = productManagementOverride ?? (
    dataRepository === repository
      ? productManagement
      : createProductManagement({
          repository: dataRepository,
          pricingAndDiscountManagement,
        })
  );
  const inquiries = inquiryManagementOverride ?? (
    dataRepository === repository
      ? inquiryManagement
      : createInquiryManagement({ repository: dataRepository })
  );
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

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
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
    "/api/admin/inquiries",
    createInquiryRoutes({ inquiryManagement: inquiries, authenticate }),
  );
  app.use("/api/admin/orders", orderRoutes.adminRouter);
  app.use("/api/admin/availability", availabilityRoutes.adminRouter);
  app.use("/api/customer/availability", availabilityRoutes.customerRouter);
  app.use("/api/availability", availabilityRoutes.publicRouter);
  app.use("/api/customer/orders", orderRoutes.customerRouter);
  app.use("/api/orders", orderRoutes.customerRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

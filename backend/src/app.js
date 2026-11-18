import express from "express";
import cors from "cors";
import repository from "./data-access/repositories/index.js";
import productManagement, { createProductManagement } from "./business-logic/product/index.js";
import pricingAndDiscountManagement from "./business-logic/pricing/index.js";
import { authenticateRequest } from "./presentation/middleware/authentication.js";
import healthRoutes from "./presentation/routes/health.routes.js";
import { createProductRoutes } from "./presentation/routes/product.routes.js";
import { notFoundHandler } from "./presentation/middleware/notFoundHandler.js";
import { errorHandler } from "./presentation/middleware/errorHandler.js";

export function createApp({
  dataRepository = repository,
  productManagement: productManagementOverride,
  authenticate = authenticateRequest,
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

  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
  app.use(express.json());

  app.use("/api", healthRoutes);
  app.use(
    "/api/admin/products",
    createProductRoutes({ productManagement: products, authenticate }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

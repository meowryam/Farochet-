import { Router } from "express";
import { createPricingController } from "../controllers/pricing.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRaazia } from "../middleware/authorizeRole.js";

function createPublicPricingRouter(pricingAndDiscountManagement) {
  const router = Router();
  const controller = createPricingController(pricingAndDiscountManagement);
  router.get("/", controller.publicState);
  return router;
}

function createAdminPricingRouter({
  pricingAndDiscountManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!pricingAndDiscountManagement) {
    throw new Error("Admin pricing routes require Pricing and Discount Management.");
  }

  const router = Router();
  const controller = createPricingController(pricingAndDiscountManagement);
  router.use(authenticate, requireRaazia);
  router.put("/public-discount", controller.activateOrUpdate);
  router.patch("/public-discount", controller.activateOrUpdate);
  router.delete("/public-discount", controller.remove);
  return router;
}

export { createPublicPricingRouter, createAdminPricingRouter };

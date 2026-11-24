import { Router } from "express";
import { createCustomizationController } from "../controllers/customization.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRaazia, requireRole } from "../middleware/authorizeRole.js";

function createCustomizationRoutes({
  customizationManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!customizationManagement) {
    throw new Error("Customization routes require Customization and Quotation Management.");
  }

  const router = Router();
  const controller = createCustomizationController(customizationManagement);

  router.use(authenticate, requireRole("CUSTOMER"));
  router.post("/requests", controller.submit);
  router.get("/requests/:id", controller.get);
  router.get("/requests/:id/negotiation", controller.getNegotiation);
  router.post("/requests/:id/negotiation", controller.addNegotiationEntry);
  router.get("/images", controller.getImage);

  return router;
}

function createAdminCustomizationRoutes({
  customizationManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!customizationManagement) {
    throw new Error("Admin customization routes require Customization and Quotation Management.");
  }

  const router = Router();
  const controller = createCustomizationController(customizationManagement);

  router.use(authenticate, requireRaazia);
  router.get("/requests", controller.list);
  router.get("/requests/:id", controller.get);
  router.get("/requests/:id/negotiation", controller.getNegotiation);
  router.post("/requests/:id/negotiation", controller.addNegotiationEntry);
  router.get("/images", controller.getImage);

  return router;
}

export default createCustomizationRoutes;
export { createCustomizationRoutes, createAdminCustomizationRoutes };

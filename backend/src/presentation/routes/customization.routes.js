import { Router } from "express";
import { createCustomizationController } from "../controllers/customization.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

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

  return router;
}

export default createCustomizationRoutes;
export { createCustomizationRoutes };

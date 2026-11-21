import { Router } from "express";
import { createAvailabilityController } from "../controllers/availability.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

function createAvailabilityRoutes({
  availabilityManagement,
  authenticate = authenticateRequest,
  authenticateCustomer = authenticate,
} = {}) {
  if (!availabilityManagement) {
    throw new Error("Availability routes require Availability Management.");
  }

  const controller = createAvailabilityController(availabilityManagement);

  const adminRouter = Router();
  adminRouter.use(authenticate, requireRole("RAAZIA"));
  adminRouter.get("/", controller.get);
  adminRouter.put("/", controller.update);

  const customerRouter = Router();
  customerRouter.use(authenticateCustomer, requireRole("CUSTOMER"));
  customerRouter.get("/", controller.get);

  const publicRouter = Router();
  publicRouter.get("/", controller.get);

  return { adminRouter, customerRouter, publicRouter };
}

export default createAvailabilityRoutes;
export { createAvailabilityRoutes };

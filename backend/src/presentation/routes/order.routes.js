import { Router } from "express";
import { createOrderController } from "../controllers/order.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

function createOrderRoutes({
  orderManagement,
  statusManagement,
  authenticate = authenticateRequest,
  authenticateCustomer = authenticate,
} = {}) {
  if (!orderManagement) {
    throw new Error("Order routes require Order Management.");
  }

  if (!statusManagement) {
    throw new Error("Order routes require Status Management.");
  }
  const controller = createOrderController(orderManagement, statusManagement);
  const adminRouter = Router();
  adminRouter.use(authenticate, requireRole("RAAZIA"));
  adminRouter.get("/", controller.list);
  adminRouter.get("/:id", controller.get);
  adminRouter.patch("/:id/status", controller.updateManufacturingProgress);

  const customerRouter = Router();
  customerRouter.use(authenticateCustomer, requireRole("CUSTOMER"));
  customerRouter.get("/my", controller.list);
  customerRouter.get("/", controller.list);
  customerRouter.get("/:id", controller.get);

  return { adminRouter, customerRouter };
}

export default createOrderRoutes;
export { createOrderRoutes };

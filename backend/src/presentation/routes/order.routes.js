import { Router } from "express";
import { createOrderController } from "../controllers/order.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

function createOrderRoutes({
  orderManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!orderManagement) {
    throw new Error("Order routes require Order Management.");
  }

  const controller = createOrderController(orderManagement);
  const adminRouter = Router();
  adminRouter.use(authenticate, requireRole("RAAZIA"));
  adminRouter.get("/", controller.list);
  adminRouter.get("/:id", controller.get);

  const customerRouter = Router();
  customerRouter.use(authenticate, requireRole("CUSTOMER"));
  customerRouter.get("/", controller.list);
  customerRouter.get("/:id", controller.get);

  return { adminRouter, customerRouter };
}

export default createOrderRoutes;
export { createOrderRoutes };

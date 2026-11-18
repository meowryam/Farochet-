import { Router } from "express";
import { createProductController } from "../controllers/product.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRaazia } from "../middleware/authorizeRole.js";

function createProductRoutes({
  productManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!productManagement) {
    throw new Error("Product routes require Product Management.");
  }

  const router = Router();
  const controller = createProductController(productManagement);

  router.use(authenticate, requireRaazia);
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.get("/:id", controller.get);
  router.put("/:id", controller.update);
  router.patch("/:id/archive", controller.archive);

  return router;
}

export default createProductRoutes;
export { createProductRoutes };

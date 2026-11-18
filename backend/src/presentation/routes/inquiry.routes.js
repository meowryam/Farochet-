import { Router } from "express";
import { createInquiryController } from "../controllers/inquiry.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRaazia } from "../middleware/authorizeRole.js";

function createInquiryRoutes({
  inquiryManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!inquiryManagement) {
    throw new Error("Inquiry routes require Inquiry Management.");
  }

  const router = Router();
  const controller = createInquiryController(inquiryManagement);

  router.use(authenticate, requireRaazia);
  router.get("/", controller.list);
  router.get("/:id", controller.get);

  return router;
}

export default createInquiryRoutes;
export { createInquiryRoutes };

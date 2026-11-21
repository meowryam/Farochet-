import { Router } from "express";
import { createAuthController } from "../controllers/auth.controller.js";
import repository from "../../data-access/repositories/index.ts";
import {
  authenticateRequest,
  createSupabaseIdentityVerification,
} from "../middleware/authentication.js";

function createAuthRoutes({
  authenticate = authenticateRequest,
  verifyIdentity = createSupabaseIdentityVerification(),
  userRepository = repository,
  authControllerOptions = {},
} = {}) {
  const router = Router();
  const controller = createAuthController({ ...authControllerOptions, userRepository });

  router.get("/me", authenticate, controller.me);
  router.post("/register", controller.registerCustomer);
  router.post("/registration/activate", verifyIdentity, controller.activateCustomerRegistration);
  router.post("/profile", verifyIdentity, controller.profile);

  return router;
}

export default createAuthRoutes;
export { createAuthRoutes };

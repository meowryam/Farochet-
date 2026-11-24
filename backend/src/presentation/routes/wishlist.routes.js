import { Router } from "express";
import { createWishlistController } from "../controllers/wishlist.controller.js";
import { authenticateRequest } from "../middleware/authentication.js";
import { requireRole } from "../middleware/authorizeRole.js";

function createWishlistRoutes({
  wishlistManagement,
  authenticate = authenticateRequest,
} = {}) {
  if (!wishlistManagement) {
    throw new Error("Wishlist routes require Wishlist Management.");
  }

  const router = Router();
  const controller = createWishlistController(wishlistManagement);

  router.use(authenticate, requireRole("CUSTOMER"));
<<<<<<< HEAD
  router.get("/", controller.list);
  router.post("/", controller.add);
  router.delete("/:productId", controller.remove);
=======
  router.get("/:productId", controller.checkProduct);
  router.put("/:productId", controller.addProduct);
>>>>>>> 9a9ecf1 (c4m1)

  return router;
}

<<<<<<< HEAD
export default createWishlistRoutes;
=======
>>>>>>> 9a9ecf1 (c4m1)
export { createWishlistRoutes };
